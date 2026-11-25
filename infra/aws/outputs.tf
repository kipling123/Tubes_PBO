output "alb_dns_name" {
  description = "Public DNS name for the POS API load balancer."
  value       = aws_lb.api.dns_name
}

output "api_base_url" {
  description = "Same-origin API path to use as VITE_API_BASE_URL behind the CloudFront /api/* behavior."
  value       = "/api"
}

output "alb_origin_domain_name" {
  description = "ALB DNS hostname to configure as the frontend CloudFront /api/* origin."
  value       = aws_lb.api.dns_name
}

output "autoscaling_group_name" {
  description = "Name of the backend Auto Scaling Group."
  value       = aws_autoscaling_group.backend.name
}

output "target_group_arn" {
  description = "Target Group ARN attached to the backend Auto Scaling Group."
  value       = aws_lb_target_group.api.arn
}

output "vpc_id" {
  description = "VPC ID used by the backend and shared-storage stacks."
  value       = aws_vpc.main.id
}

output "backend_security_group_id" {
  description = "Backend security group ID used to authorize NFS from EC2 to EFS."
  value       = aws_security_group.backend.id
}

output "backend_subnet_a_id" {
  description = "First backend subnet ID for an EFS mount target."
  value       = aws_subnet.public[0].id
}

output "backend_subnet_b_id" {
  description = "Second backend subnet ID for an EFS mount target."
  value       = aws_subnet.public[1].id
}
