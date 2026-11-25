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
