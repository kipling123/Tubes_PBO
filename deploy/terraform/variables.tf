variable "aws_region" {
  description = "Region AWS untuk bucket S3 dan CloudFront."
  type        = string
  default     = "ap-southeast-1"
}

variable "project" {
  description = "Prefix nama resource."
  type        = string
  default     = "toko-maju-pos"
}

variable "environment" {
  description = "Label environment."
  type        = string
  default     = "tugas9"
}

variable "bucket_name" {
  description = "Nama bucket S3 frontend. Kosong = dibuat otomatis dari project + account ID."
  type        = string
  default     = ""
}

variable "api_origin_domain_name" {
  description = "ALB DNS hostname (or custom DNS name resolving to the ALB) for the /api/* origin; leave empty only before the ALB exists."
  type        = string
  default     = ""

  validation {
    condition     = var.api_origin_domain_name == "" || can(regex("^[A-Za-z0-9.-]+$", var.api_origin_domain_name))
    error_message = "api_origin_domain_name must be a DNS hostname without scheme, path, or port."
  }
}

variable "api_origin_protocol_policy" {
  description = "Protocol CloudFront uses to reach the ALB origin. Use https-only with a custom API hostname and matching ALB ACM certificate."
  type        = string
  default     = "http-only"

  validation {
    condition     = contains(["http-only", "https-only"], var.api_origin_protocol_policy)
    error_message = "api_origin_protocol_policy must be http-only or https-only."
  }
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "price_class harus PriceClass_100, PriceClass_200, atau PriceClass_All."
  }
}

variable "force_destroy_bucket" {
  description = "Izinkan Terraform menghapus bucket beserta isinya."
  type        = bool
  default     = false
}
