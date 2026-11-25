variable "aws_region" {
  description = "Region AWS untuk EC2, S3, dan CloudFront."
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

variable "instance_type" {
  description = "Tipe EC2. t3.micro cukup untuk demo."
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Nama EC2 Key Pair yang sudah ada di region ini."
  type        = string
}

variable "admin_cidr" {
  description = "CIDR IP admin untuk SSH (contoh: 203.0.113.10/32). Kosong = SSH dinonaktifkan."
  type        = string
  default     = ""
}

variable "alb_security_group_id" {
  description = "Security Group ALB dari Load Balancing Engineer. Kosong = HTTP dibuka sementara ke publik."
  type        = string
  default     = ""
}

variable "subnet_id" {
  description = "Subnet EC2. Kosong = subnet pertama di default VPC."
  type        = string
  default     = ""
}

variable "repo_url" {
  description = "URL repo Git aplikasi untuk cloud-init."
  type        = string
  default     = "https://github.com/kipling123/Tubes_PBO.git"
}

variable "branch" {
  description = "Branch Git yang di-deploy."
  type        = string
  default     = "main"
}

variable "create_eip" {
  description = "Buat Elastic IP untuk EC2."
  type        = bool
  default     = true
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

variable "root_volume_size" {
  description = "Ukuran disk EC2 (GB)."
  type        = number
  default     = 16
}
