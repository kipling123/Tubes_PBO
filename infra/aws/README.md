# AWS Load Balancer & Auto Scaling (Django API)

Terraform files in this folder create a demo AWS stack for the Django API: VPC with two public subnets in separate Availability Zones, Application Load Balancer (ALB), EC2 Launch Template, Auto Scaling Group (ASG), and CPU target tracking.

> **Cost and safety:** `terraform apply` creates billable AWS resources (ALB, EC2, data transfer, and more). This setup is intentionally not applied automatically. Use a student/sandbox account, confirm the region and budget first, and run `terraform destroy` when finished. Do not commit credentials, `terraform.tfstate`, or `terraform.tfvars` containing secrets.

## Prerequisites

- Terraform 1.6+ and AWS CLI installed.
- AWS credentials configured locally through an AWS profile/environment, never in this repository.
- The backend repository pushed to a Git remote accessible by a fresh Ubuntu instance. For a private repository, configure a safe deploy key or other non-interactive authentication; do not put a personal access token in Terraform variables or user data.
- The `backend_django/` code includes Gunicorn in requirements and the `/api/health/` route.

## Deploy

From this directory:

1. Copy `terraform.tfvars.example` to `terraform.tfvars`; set `backend_repo_url` and, if needed, a branch, region, SSH key/CIDR, or `additional_allowed_hosts` for a custom API domain. `terraform.tfvars` is ignored by git.
2. Run `terraform init`.
3. Run `terraform fmt -check` and `terraform validate`.
4. First create only the VPC/ALB/ASG shell: set `min_size = 0`, `desired_capacity = 0`, and `max_size = 4`; review `terraform plan`, then apply. No backend instance starts in this phase.
5. Deploy `pos-shared-storage-observability.yaml` using the `vpc_id`, `backend_security_group_id`, `backend_subnet_a_id`, `backend_subnet_b_id`, and `autoscaling_group_name` outputs. Follow [SHARED_STORAGE.md](./SHARED_STORAGE.md).
6. Put the EFS stack outputs `FileSystemId`, `AccessPointId`, and `Ec2InstanceProfileName` into `efs_file_system_id`, `efs_access_point_id`, and `efs_instance_profile_name` in `terraform.tfvars`. Then set ASG capacity, for example minimum 2, desired 2, maximum 4. Run `terraform plan` and apply. The Launch Template attaches the IAM profile and the EC2 bootstrap mounts EFS before starting Django.
7. Read the ALB DNS and API base URL from `terraform output`.
8. Configure `deploy/terraform/terraform.tfvars` with `api_origin_domain_name` set to the ALB's `alb_origin_domain_name` output, then apply the frontend stack. Build/upload with `VITE_API_BASE_URL=/api`; CloudFront routes `/api/*` to the ALB over the selected origin protocol.
9. Check `http(s)://<ALB-DNS>/api/health/` and wait for both target group targets to show healthy. If unhealthy, check EC2 system log and `/var/log/pos-bootstrap.log`, then `journalctl -u pos-backend`, `systemctl status nginx`, and `nginx -t`.
10. Destroy demo resources when finished. Remove the CloudFormation storage stack and frontend stack as well; confirm S3 backup data is no longer needed before deleting the versioned bucket.

For direct ALB HTTPS, provide an ACM certificate ARN for a custom DNS name that resolves to the ALB and add that hostname to `additional_allowed_hosts`. HTTP continues to forward so CloudFront can use its configured origin protocol. To encrypt CloudFront-to-ALB traffic, set the frontend origin to that custom hostname and `api_origin_protocol_policy = "https-only"`; the default `http-only` mode is for the class demo.

## Resources and behavior

- ALB listener forwards traffic to target group instances on TCP 80 (Nginx). AWS ALB uses its managed routing algorithm; this configuration selects round-robin.
- Target health is `GET /api/health/`, expects HTTP 200, probes every 20 seconds, and removes unhealthy targets from routing.
- The ASG is initially created at zero capacity so EFS can be provisioned before application instances start. After EFS outputs are configured, set the desired/min/max capacity (e.g. 2/2/4) across the two Availability Zones. CPU target tracking is 60%; AWS manages its scaling alarms, while the separate CloudFormation stack provides the team's CPU/EFS dashboard and SNS alarms.
- Backend instance security group accepts port 80 only from the ALB security group; Gunicorn stays on 127.0.0.1:8000 and port 8000 is never exposed. SSH is closed unless trusted CIDRs are explicitly configured.
- Django `ALLOWED_HOSTS` is set to the ALB DNS hostname plus any `additional_allowed_hosts`; do not add a wildcard host.
- Instances bootstrap Ubuntu via `user_data.sh.tftpl`, then run `deploy/scripts/setup-ec2.sh`: Nginx reverse proxy on port 80, Gunicorn on `127.0.0.1:8000`, and a systemd unit. Once EFS outputs are supplied, bootstrap installs the EFS mount helper, mounts the EFS access point, and sets `POS_DATA_FILE=/mnt/pos-efs/data_store.json` before the backend starts.
- Browser clients use same-origin `/api` via CloudFront. `127.0.0.1` in a deployed browser means the user's own computer, not the EC2 server.

## Load test

Install k6 locally and run the read-only test from the repository's `loadtest/` directory. Set `BASE_URL` to the ALB origin without `/api`. In PowerShell:

```powershell
$env:BASE_URL = "http://<ALB-DNS>"
k6 run loadtest.js
```

The included scenario runs for 80 seconds and peaks at 5 virtual users. Treat it as a low-load readiness check, not proof that Auto Scaling will trigger; only raise traffic with instructor/team approval and while monitoring the AWS account. Never test systems outside your authorization.

Record results in the report: test date, region, VU/duration, mean/p95 latency, request count, errors, CPU, instance count before/after, and scale-out/in timing. Test scale-in only after load drops and the configured cooldown/warm-up periods pass.

The health endpoint's Django regression test can be run from `backend_django/` with `python manage.py test api.tests`.

## Important application limitation

The ALB/ASG stack alone does **not** make application data shared. Do not launch backend instances for POS writes until the EFS stack is deployed and all three EFS outputs are configured in the Launch Template. The shared store serializes API operations and uses atomic JSON replacement; see [SHARED_STORAGE.md](./SHARED_STORAGE.md). For a demo without EFS, set ASG capacity to one and do not claim multi-instance state consistency.

## Shared JSON storage, monitoring, and backups

The EFS shared-state implementation, CloudWatch dashboard and SNS alarms, and daily S3 JSON backup are documented separately in [SHARED_STORAGE.md](./SHARED_STORAGE.md). Deploy those resources before enabling multi-instance POS writes. The shared store serializes API operations and uses atomic JSON replacement; the CloudFormation stack expects the VPC, backend Auto Scaling Group, and backend security group described above to already exist.
