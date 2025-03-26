# Look for existing security group
data "aws_security_group" "ec2_existing" {
  count = var.security_group_id != "" ? 1 : 0  # Only look if we're using an existing security group
  
  filter {
    name   = "group-name"
    values = ["${var.app_name}-ec2-sg"]
  }
  
  filter {
    name   = "vpc-id"
    values = [local.vpc_id != null ? local.vpc_id : "vpc-placeholder"]
  }
}

# Look for existing EC2 security group or use the shared security group
data "aws_security_group" "ec2_sg" {
  count = var.security_group_id != "" ? 0 : 1
  name   = "${var.app_name}-ec2-sg"
  vpc_id = local.vpc_id != null ? local.vpc_id : "vpc-placeholder"
}

# Get the shared security group if provided
data "aws_security_group" "shared_sg" {
  count = var.security_group_id != "" ? 1 : 0
  id    = var.security_group_id != "" ? var.security_group_id : "sg-placeholder"
}


# EC2 Instance for hosting the application
resource "aws_instance" "app_instance" {
  count                  = var.ec2_exists ? 1 : 0
  ami                    = "ami-0905a3c97561e0b69" # Ubuntu 22.04 LTS in eu-west-1
  instance_type          = var.ec2_instance_type
  key_name               = var.ssh_key_name
  
  # Use the public subnet from main.tf
  subnet_id = local.public_subnet_id
  
  # Use the security group ID from the variable if provided, otherwise use the EC2 security group
  vpc_security_group_ids = var.security_group_id != "" ? [var.security_group_id] : [data.aws_security_group.ec2_sg[0].id]
  
  associate_public_ip_address = true
  
  # User data script to set up the instance
  user_data = <<-EOF
    #!/bin/bash
    echo "Setting up the EC2 instance..."
    apt-get update
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    
    # Install Node.js
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Create app directory
    mkdir -p /home/ubuntu/app
    chown -R ubuntu:ubuntu /home/ubuntu/app
    
    # Set up PM2 to start on boot
    env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
    
    echo "EC2 instance setup complete!"
  EOF
  
  tags = {
    Name = "${var.app_name}-instance"
  }
  
  # Wait for the instance to be created before returning
  lifecycle {
    create_before_destroy = true
  }
}

# Data source to get information about the existing instance if it exists
data "aws_instance" "existing_instance" {
  count       = var.ec2_exists ? 1 : 0
  instance_id = var.ec2_id
}

# Output the public IP - using the local variable for safety
output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = data.aws_instance.existing_instance[0].public_ip
}