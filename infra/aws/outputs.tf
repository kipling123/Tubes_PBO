output "alb_dns_name" {
  description = "Public DNS name for the POS API load balancer."
  value       = aws_lb.api.dns_name
}

output "api_base_url" {
  description = "Base API URL to use as VITE_API_BASE_URL when building the frontend."
  value       = "${var.acm_certificate_arn == "" ? "http" : "https"}://${aws_lb.api.dns_name}/api"
}

output "autoscaling_group_name" {
  description = "Name of the backend Auto Scaling Group."
  value       = aws_autoscaling_group.backend.name
}

output "target_group_arn" {
  description = "Target Group ARN attached to the backend Auto Scaling Group."
  value       = aws_lb_target_group.api.arn
}
