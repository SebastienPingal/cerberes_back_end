# Look for existing security group
data "aws_security_group" "ec2_existing" {
  count = 0  # This will be set to 1 by the workflow if we want to use existing security groups
  
  filter {
    name   = "group-name"
    values = ["${var.app_name}-ec2-sg"]
  }
  
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }
}

# Look for existing EC2 security group or use the shared security group
data "aws_security_group" "ec2_sg" {
  count = var.security_group_id != "" ? 0 : 1
  name   = "${var.app_name}-ec2-sg"
  vpc_id = local.vpc_id
}

# Get the shared security group if provided
data "aws_security_group" "shared_sg" {
  count = var.security_group_id != "" ? 1 : 0
  id    = var.security_group_id
}

# Use existing EC2 instance if it exists
# This is handled in the workflow by checking for existing resources
data "aws_instances" "existing" {
  count = 0  # Always set to 0 to avoid errors
}

# Local variable to determine if we should create a new instance
locals {
  # Check if we should create a new instance - safely handle empty tuples
  create_instance = true  # Default to creating a new instance
  
  # Get the existing IP if available - safely handle empty tuples
  existing_ip = ""  # Default to empty string
  
  # Get the IP of the new instance if created
  new_instance_ip = length(aws_instance.app_instance) > 0 ? aws_instance.app_instance[0].public_ip : ""
  
  # Determine which security group to use
  use_existing_sg = var.security_group_id == "" && var.existing_ec2_sg_id != ""
  
  # Security group ID to use
  sg_id = var.security_group_id != "" ? var.security_group_id : (local.use_existing_sg ? var.existing_ec2_sg_id : (length(data.aws_security_group.ec2_sg) > 0 ? data.aws_security_group.ec2_sg[0].id : ""))
  
  # Get the IP to use for output
  instance_ip = local.existing_ip != "" ? local.existing_ip : local.new_instance_ip
}

# EC2 Instance for hosting the application
resource "aws_instance" "app_instance" {
  count         = local.create_instance ? 1 : 0
  ami           = "ami-0905a3c97561e0b69" # Ubuntu 22.04 LTS in eu-west-1
  instance_type = var.ec2_instance_type
  key_name      = var.ssh_key_name
  
  # Use the public subnet
  subnet_id = aws_subnet.public_subnet[0].id
  
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

# Output the public IP - using the local variable for safety
output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = local.instance_ip
}