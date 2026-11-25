variable "aws_region" {
  description = "AWS region for the POS load-balancing stack."
  type        = string
  default     = "ap-southeast-1"
}

variable "name_prefix" {
  description = "Prefix used to name AWS resources."
  type        = string
  default     = "toko-maju-pos"
}

variable "backend_repo_url" {
  description = "HTTPS URL of the Git repository containing backend_django/. The instance must be able to clone it without interactive credentials."
  type        = string

  validation {
    condition     = can(regex("^https://", var.backend_repo_url))
    error_message = "backend_repo_url must use an HTTPS Git URL."
  }
}

variable "backend_git_ref" {
  description = "Branch or tag containing the backend version to deploy."
  type        = string
  default     = "main"
}

variable "instance_type" {
  description = "EC2 instance type used by the Auto Scaling Group."
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Optional EC2 key pair name for emergency SSH access. Leave empty to disable SSH access."
  type        = string
  default     = ""
}

variable "ssh_cidr_blocks" {
  description = "Optional trusted IPv4 CIDRs allowed to SSH. Do not use 0.0.0.0/0."
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for cidr in var.ssh_cidr_blocks : can(cidrhost(cidr, 0)) && cidr != "0.0.0.0/0"
    ])
    error_message = "ssh_cidr_blocks must contain valid, restricted IPv4 CIDRs; 0.0.0.0/0 is not allowed."
  }
}

variable "additional_allowed_hosts" {
  description = "Optional extra Django hostnames, such as a custom API domain. The ALB DNS name is always included."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "Optional ACM certificate ARN in the same region. When set, HTTPS is enabled and HTTP redirects to HTTPS."
  type        = string
  default     = ""
}

variable "min_size" {
  description = "Minimum number of backend EC2 instances."
  type        = number
  default     = 2

  validation {
    condition     = var.min_size >= 1
    error_message = "min_size must be at least 1."
  }
}

variable "desired_capacity" {
  description = "Initial desired number of backend EC2 instances."
  type        = number
  default     = 2

  validation {
    condition     = var.desired_capacity >= 1
    error_message = "desired_capacity must be at least 1."
  }
}

variable "max_size" {
  description = "Maximum number of backend EC2 instances."
  type        = number
  default     = 4

  validation {
    condition     = var.max_size >= 1
    error_message = "max_size must be at least 1."
  }
}

variable "target_cpu_utilization" {
  description = "Target average CPU percentage used by the ASG target-tracking policy."
  type        = number
  default     = 60

  validation {
    condition     = var.target_cpu_utilization > 0 && var.target_cpu_utilization <= 100
    error_message = "target_cpu_utilization must be greater than 0 and no more than 100."
  }
}
