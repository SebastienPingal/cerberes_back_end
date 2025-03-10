# Security group for EC2
resource "aws_security_group" "ec2_sg" {
  name        = "${var.app_name}-ec2-sg"
  description = "Security group for EC2 instance"
  vpc_id      = aws_vpc.app_vpc.id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Consider restricting to your IP for production
  }

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Application port
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-ec2-sg"
  }
  
  # Allow replacement of security group if it exists
  lifecycle {
    create_before_destroy = true
  }
}

# Use existing EC2 instance if it exists
# This is handled in the workflow by checking for existing resources
data "aws_instances" "existing" {
  filter {
    name   = "tag:Name"
    values = ["${var.app_name}-instance"]
  }
  
  filter {
    name   = "instance-state-name"
    values = ["running", "stopped"]
  }
  
  count = 0  # This is set to 0 by default, but the workflow will modify this file if instances exist
}

# Local variable to determine if we should create a new instance
locals {
  create_instance = length(data.aws_instances.existing) == 0 ? true : length(data.aws_instances.existing) > 0 && length(data.aws_instances.existing[0].ids) == 0
  
  # Safe way to get the public IP
  existing_ip = length(data.aws_instances.existing) > 0 ? (
    length(data.aws_instances.existing[0].ids) > 0 ? (
      length(data.aws_instances.existing[0].public_ips) > 0 ? data.aws_instances.existing[0].public_ips[0] : ""
    ) : ""
  ) : ""
  
  new_instance_ip = length(aws_instance.app_instance) > 0 ? aws_instance.app_instance[0].public_ip : ""
  
  # Final IP to use
  final_ip = local.existing_ip != "" ? local.existing_ip : (
    local.new_instance_ip != "" ? local.new_instance_ip : "no-ip-available"
  )
}

# EC2 Instance for hosting the application - only created if it doesn't already exist
resource "aws_instance" "app_instance" {
  # Only create if no existing instances are found
  count                  = local.create_instance ? 1 : 0
  ami                    = "ami-01dd271720c1ba44f"  # Amazon Linux 2023 AMI for eu-west-1 (Ireland)
  instance_type          = var.ec2_instance_type
  key_name               = var.ssh_key_name
  subnet_id              = aws_subnet.public_subnet.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y nodejs npm git
              npm install -g pnpm pm2
              
              # Create application directory
              mkdir -p /home/ec2-user/app
              chown -R ec2-user:ec2-user /home/ec2-user/app
              
              # Configure PM2 to start on boot
              pm2 startup
              env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
              
              echo "EC2 instance setup complete"
              EOF

  tags = {
    Name = "${var.app_name}-instance"
  }
}

# Output the public IP - using the local variable for safety
output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = local.final_ip
}