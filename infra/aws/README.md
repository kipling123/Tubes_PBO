# AWS Load Balancer & Auto Scaling (Django API)

Terraform files in this folder create a demo AWS stack for the Django API: VPC with two public subnets in separate Availability Zones, Application Load Balancer (ALB), EC2 Launch Template, Auto Scaling Group (ASG), and CPU target tracking.

> **Cost and safety:** `terraform apply` creates billable AWS resources (ALB, EC2, data transfer, and more). This setup is intentionally not applied automatically. Use a student/sandbox account, confirm the region and budget first, and run `terraform destroy` when finished. Do not commit credentials, `terraform.tfstate`, or `terraform.tfvars` containing secrets.

## Prerequisites

- Terraform 1.5+ and AWS CLI installed.
- AWS credentials configured locally through an AWS profile/environment, never in this repository.
- The backend repository pushed to a Git remote accessible by a fresh Ubuntu instance. For a private repository, configure a safe deploy key or other non-interactive authentication; do not put a personal access token in Terraform variables or user data.
- The `backend_django/` code includes Gunicorn in requirements and the `/api/health/` route.

## Deploy

From this directory:

1. Copy `terraform.tfvars.example` to `terraform.tfvars`; set `backend_repo_url` and, if needed, a branch, region, SSH key/CIDR, or `additional_allowed_hosts` for a custom API domain. `terraform.tfvars` is ignored by git.
2. Run `terraform init`.
3. Run `terraform fmt -check` and `terraform validate`.
4. Review `terraform plan` carefully, then apply only if the cost is acceptable.
5. Read the ALB DNS and API base URL from `terraform output`.
6. Build the React frontend with `VITE_API_BASE_URL` set to the output `api_base_url`. API calls use `/api` relative to the frontend host by default for local Vite proxy use; set the environment value to the ALB API URL for a separately hosted frontend.
7. Check `http(s)://<ALB-DNS>/api/health/` and wait for both target group targets to show healthy. If unhealthy, check EC2 system log and `/var/log/pos-bootstrap.log`, then `journalctl -u pos-backend`, `systemctl status nginx`, and `nginx -t`.
8. Destroy demo resources when finished: `terraform destroy`.

HTTPS is optional. To enable it, provide an ACM certificate ARN from the same region; HTTP then redirects to HTTPS. For public HTTPS, the certificate must be valid for a domain associated with the ALB.

## Resources and behavior

- ALB listener forwards traffic to target group instances on TCP 80 (Nginx). AWS ALB uses its managed routing algorithm; this configuration selects round-robin.
- Target health is `GET /api/health/`, expects HTTP 200, probes every 20 seconds, and removes unhealthy targets from routing.
- ASG starts with 2 instances across 2 Availability Zones, may scale between 2 and 4, and uses target tracking at 60% average CPU. The target-tracking policy creates/uses CloudWatch alarms automatically. Tune these limits for the class demo and budget.
- Backend instance security group accepts port 80 only from the ALB security group; Gunicorn stays on 127.0.0.1:8000 and port 8000 is never exposed. SSH is closed unless trusted CIDRs are explicitly configured.
- Django `ALLOWED_HOSTS` is set to the ALB DNS hostname plus any `additional_allowed_hosts`; do not add a wildcard host.
- Instances bootstrap Ubuntu via `user_data.sh.tftpl`, then run `deploy/scripts/setup-ec2.sh`: Nginx reverse proxy on port 80, Gunicorn on 127.0.0.1:8000 with 3 workers, and a systemd unit. One worker per instance (or `min_size = 1` for write demos) avoids separate in-memory state; nothing is shared across EC2 instances.
- Browser clients must call the ALB API URL (or a same-origin `/api` reverse-proxy route); `127.0.0.1` in a deployed browser means the user's own computer, not the EC2 server.

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

The Terraform ALB/ASG stack alone does **not** make application data shared: instances use local JSON until the separate EFS stack is deployed, the access point is mounted, and `POS_DATA_FILE` points to the shared file. Do not enable multi-instance POS writes before completing those steps. The shared store serializes API operations and uses atomic JSON replacement; see [SHARED_STORAGE.md](./SHARED_STORAGE.md). For a demo without EFS, disable horizontal scaling (`min_size = 1`, `desired_capacity = 1`, `max_size = 1`) or keep traffic read-only.

## Shared JSON storage, monitoring, and backups

The EFS shared-state implementation, CloudWatch dashboard and SNS alarms, and daily S3 JSON backup are documented separately in [SHARED_STORAGE.md](./SHARED_STORAGE.md). Deploy those resources before enabling multi-instance POS writes. The shared store serializes API operations and uses atomic JSON replacement; the CloudFormation stack expects the VPC, backend Auto Scaling Group, and backend security group described above to already exist.
