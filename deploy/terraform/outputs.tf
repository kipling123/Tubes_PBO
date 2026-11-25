output "cloudfront_domain_name" {
  description = "Domain CloudFront untuk frontend."
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  description = "ID distribusi CloudFront untuk invalidasi cache."
  value       = aws_cloudfront_distribution.frontend.id
}

output "s3_bucket_name" {
  description = "Nama bucket S3 frontend."
  value       = aws_s3_bucket.frontend.bucket
}

output "ec2_public_ip" {
  description = "Public IP EC2 (Elastic IP jika dibuat)."
  value       = var.create_eip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip
}

output "ec2_security_group_id" {
  description = "Security Group EC2 (berikan ke Load Balancing Engineer)."
  value       = aws_security_group.ec2.id
}

output "ssh_command" {
  description = "Contoh perintah SSH."
  value       = "ssh -i <path-to-key>.pem ubuntu@${var.create_eip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip}"
}
