data "aws_caller_identity" "current" {}

data "aws_vpc" "default" {
  count   = var.subnet_id == "" ? 1 : 0
  default = true
}

data "aws_subnets" "default" {
  count = var.subnet_id == "" ? 1 : 0

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default[0].id]
  }
}

data "aws_subnet" "selected" {
  count = var.subnet_id == "" ? 0 : 1
  id    = var.subnet_id
}

locals {
  bucket_name = var.bucket_name != "" ? var.bucket_name : "${var.project}-frontend-${data.aws_caller_identity.current.account_id}"

  vpc_id = var.subnet_id != "" ? try(data.aws_subnet.selected[0].vpc_id, null) : try(data.aws_vpc.default[0].id, null)

  subnet_id = var.subnet_id != "" ? var.subnet_id : try(data.aws_subnets.default[0].ids[0], null)
}
