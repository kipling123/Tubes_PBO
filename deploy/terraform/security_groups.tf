# Security Group untuk EC2 backend.
#
# Aturan:
# - SSH 22 hanya dari IP admin.
# - HTTP 80 hanya dari Security Group ALB (jika disediakan).
# - Port 8000 (Gunicorn) TIDAK PERNAH dibuka ke publik.
# - Egress bebas untuk apt/pip dan panggilan keluar.

resource "aws_security_group" "ec2" {
  name        = "${var.project}-ec2"
  description = "Toko Maju POS EC2 - SSH terbatas, HTTP dari ALB"
  vpc_id      = local.vpc_id

  tags = {
    Name = "${var.project}-ec2"
  }
}

resource "aws_security_group_rule" "ssh_admin" {
  count = var.admin_cidr != "" ? 1 : 0

  type              = "ingress"
  description       = "SSH hanya dari IP admin"
  security_group_id = aws_security_group.ec2.id

  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = [var.admin_cidr]
}

resource "aws_security_group_rule" "http_from_alb" {
  count = var.alb_security_group_id != "" ? 1 : 0

  type              = "ingress"
  description       = "HTTP dari ALB Security Group"
  security_group_id = aws_security_group.ec2.id

  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = var.alb_security_group_id
}

resource "aws_security_group_rule" "http_public_temporary" {
  count = var.alb_security_group_id == "" ? 1 : 0

  type              = "ingress"
  description       = "HTTP publik sementara karena ALB belum tersedia"
  security_group_id = aws_security_group.ec2.id

  from_port   = 80
  to_port     = 80
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "egress_all" {
  type              = "egress"
  description       = "Egress untuk apt, pip, dan API keluar"
  security_group_id = aws_security_group.ec2.id

  from_port   = 0
  to_port     = 0
  protocol    = "-1"
  cidr_blocks = ["0.0.0.0/0"]
}
