# AWS shared storage and observability

This deployment adds the work assigned to the **Distributed Storage & Observability Engineer**:

- An encrypted Amazon EFS file system and POSIX access point mounted by the backend instances for one shared JSON state file.
- A CloudWatch dashboard and CPU/EFS I/O alarms that publish alarm and recovery notifications to SNS.
- A daily compressed JSON backup to a private, versioned S3 bucket. EFS automatic backups are enabled as an additional recovery layer.

The CloudFormation stack expects the VPC, backend EC2 Auto Scaling Group, backend security group, and two backend subnets in different AZs to already exist. In this repository, the ALB stack initially creates the ASG at zero capacity so EFS can be created before backend instances start. The EFS mount targets use the ASG's backend subnets. The stack creates the file system, access point, EC2 instance profile, S3 backup bucket, SNS topic, alarms, and dashboard. It does not create EC2 instances, the ALB, or the VPC.

## 1. Deploy the stack

Use the same AWS Region as the backend Auto Scaling Group. Choose the two subnets used by the backend ASG, in different Availability Zones; provide a third if the ASG uses a third AZ. They may be public or private, but must be in the same VPC as the backend security group. The backend security group must allow outbound TCP 2049 to the EFS mount-target security group (the current stack's default allow-all egress rule does).

```sh
aws cloudformation deploy \
  --template-file infra/aws/pos-shared-storage-observability.yaml \
  --stack-name toko-maju-pos-storage \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    VpcId="$(terraform -chdir=infra/aws output -raw vpc_id)" \
    BackendSecurityGroupId="$(terraform -chdir=infra/aws output -raw backend_security_group_id)" \
    BackendSubnetA="$(terraform -chdir=infra/aws output -raw backend_subnet_a_id)" \
    BackendSubnetB="$(terraform -chdir=infra/aws output -raw backend_subnet_b_id)" \
    AutoScalingGroupName="$(terraform -chdir=infra/aws output -raw autoscaling_group_name)" \
    AlarmEmail=operator@example.com
```

Add `BackendSubnetC=subnet-cccccccc` when needed. After the stack reaches `CREATE_COMPLETE`, confirm the SNS subscription from the email inbox. Retrieve the outputs:

```sh
aws cloudformation describe-stacks \
  --stack-name toko-maju-pos-storage \
  --query "Stacks[0].Outputs"
```

Set `efs_file_system_id`, `efs_access_point_id`, and `efs_instance_profile_name` in `infra/aws/terraform.tfvars` using outputs `FileSystemId`, `AccessPointId`, and `Ec2InstanceProfileName`. The ALB Terraform Launch Template attaches the profile, installs the EFS helper, mounts EFS before starting Django, and sets `POS_DATA_FILE`. The instance profile grants EFS client mount/write only through the configured access point and access to the `pos-json/` backup prefix in this stack's S3 bucket. The EFS mount-target security group permits NFS only from the backend security group. Re-run Terraform apply to refresh the ASG instances after setting these values.

## 2. Mount EFS on backend instances

Install the AWS EFS mount helper (`amazon-efs-utils`) using the official AWS instructions for the instance's Linux distribution. Make sure NFS TCP 2049 is allowed from the backend security group to the EFS mount-target security group. Then run this on each backend instance with the stack's `FileSystemId` and the stack's Region:

```sh
sudo bash infra/aws/scripts/setup-efs-mount.sh fs-xxxxxxxx ap-southeast-1 fsap-xxxxxxxx
```

The script adds a TLS- and IAM-authorized EFS entry to `/etc/fstab` and mounts it at `/mnt/pos-efs`. Keep the mount path the same across all instances.

Before changing the application over to EFS, stop all backend processes and copy the current JSON file once if it contains data that must be kept:

```sh
sudo cp -n backend_django/data_store.json /mnt/pos-efs/data_store.json
```

The access point exposes `/pos-data` with the UID/GID configured by the `EfsPosixUid` and `EfsPosixGid` stack parameters (default `1000:1000`). Set those parameters to the Django service user's UID/GID if it differs from 1000. Run the copy command from the project root and do not overwrite an existing shared state file. If there is no existing state to preserve, the backend initializes the shared file from its built-in JSON defaults. Ensure the Django service starts only after EFS is mounted, and set this environment variable for every backend instance:

```text
POS_DATA_FILE=/mnt/pos-efs/data_store.json
```

The backend reloads the latest JSON snapshot before each API operation, serializes read/modify/write operations using a shared lock file, and atomically replaces the JSON file. This prevents EC2 workers from serving stale process-local state or overwriting one another's updates. No SQL database is introduced.

## 3. Configure periodic S3 backups

The stack output `BackupBucketName` identifies the private, versioned bucket. Run the following on every backend instance after EFS is mounted; the shared EFS lock and date marker ensure only one snapshot is uploaded per UTC day even when multiple cron jobs run:

```sh
sudo bash infra/aws/scripts/configure-pos-backup.sh \
  <BackupBucketName> /mnt/pos-efs/data_store.json
```

The cron job runs daily at 19:15 UTC (02:15 WIB). Backups are compressed with gzip, stored under `s3://<BackupBucketName>/pos-json/`, and expired after 90 days; noncurrent object versions are retained for 30 days. The script requires Bash, `flock`, `gzip`, and AWS CLI v2, and uses the EC2 instance profile credentials. Logs are written to `/var/log/pos-json-backup.log`.

To run and verify a backup immediately:

```sh
sudo /usr/local/sbin/pos-json-backup
aws s3 ls "s3://<BackupBucketName>/pos-json/"
```

## 4. Monitor and recover

Open the CloudWatch dashboard named `toko-maju-pos-shared-storage`. It shows backend Auto Scaling Group CPU, EFS client connections, EFS I/O limit, metered I/O, and alarm states. SNS sends notifications when average backend CPU is at least 70% for two consecutive five-minute periods, when EFS `PercentIOLimit` reaches 80% for the same duration, and when either alarm returns to OK. CloudWatch metrics can take several minutes to appear and alarms remain non-breaching when metrics are missing.

To restore a daily S3 snapshot, stop all backend processes, download and inspect the chosen archive, then replace the shared state file and restart the service:

```sh
aws s3 cp "s3://<BackupBucketName>/pos-json/<snapshot>.json.gz" - \
  | gzip -dc \
  | sudo tee /mnt/pos-efs/data_store.json >/dev/null
```

EFS automatic backups and S3 JSON snapshots are separately billable AWS services. Review retention, throughput, and backup requirements before using this stack for production data.
