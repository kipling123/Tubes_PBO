data "aws_caller_identity" "current" {}

locals {
  bucket_name = var.bucket_name != "" ? var.bucket_name : "${var.project}-frontend-${data.aws_caller_identity.current.account_id}"
}
