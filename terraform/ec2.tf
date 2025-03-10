# Check for existing EC2 instances
data "aws_instances" "existing" {
  filter {
    name   = "tag:Name"
    values = ["${var.app_name}-instance"]
  }
  
  filter {
    name   = "instance-state-name"
    values = ["running", "stopped", "pending"]
  }
}

# Local variables for EC2 instance
locals {
  # Check if we already have an instance
  instance_exists = length(data.aws_instances.existing.ids) > 0
  
  # Get the existing instance ID if available
  existing_instance_id = local.instance_exists ? data.aws_instances.existing.ids[0] : null
}

# EC2 instance for the application - only create if no instance exists
resource "aws_instance" "app_instance" {
  count                  = local.instance_exists ? 0 : 1
  ami                    = "ami-0c55b159cbfafe1f0" # Ubuntu 20.04 LTS
  instance_type          = var.ec2_instance_type
  key_name               = var.ssh_key_name
  vpc_security_group_ids = [local.security_group_id]
  subnet_id              = local.public_subnet_id

  root_block_device {
    volume_size = 20
    volume_type = "gp2"
  }

  tags = {
    Name = "${var.app_name}-instance"
  }

  # User data script to install dependencies
  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y curl
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    npm install -g pm2
    mkdir -p /home/ubuntu/app
    chown -R ubuntu:ubuntu /home/ubuntu/app
  EOF

  # Wait for the instance to be created before returning
  provisioner "local-exec" {
    command = "echo '🚀 Creating new EC2 instance...'"
  }
}

# Data source to get information about the existing instance if it exists
data "aws_instance" "existing_instance" {
  count       = local.instance_exists ? 1 : 0
  instance_id = local.existing_instance_id
}

# Output the public IP of the EC2 instance
output "public_ip" {
  value       = local.instance_exists ? data.aws_instance.existing_instance[0].public_ip : (length(aws_instance.app_instance) > 0 ? aws_instance.app_instance[0].public_ip : null)
  description = "The public IP address of the EC2 instance"
}