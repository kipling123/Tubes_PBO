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
