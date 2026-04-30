variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Name prefix for provisioned resources."
  type        = string
  default     = "myconnect-test"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR range for the application VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "allowed_http_cidr_blocks" {
  description = "CIDR blocks allowed to reach the public load balancer on HTTP."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "container_port" {
  description = "Port the NestJS container listens on."
  type        = number
  default     = 3000
}

variable "image_tag" {
  description = "Container image tag in the managed ECR repository."
  type        = string
  default     = "latest"
}

variable "openai_api_key" {
  description = "OpenAI API key stored in AWS Secrets Manager and injected into ECS."
  type        = string
  sensitive   = true
}

variable "task_cpu" {
  description = "Fargate task CPU units."
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Fargate task memory in MiB."
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Number of ECS tasks to run."
  type        = number
  default     = 1
}

variable "health_check_path" {
  description = "ALB target-group health check path."
  type        = string
  default     = "/"
}

variable "db_name" {
  description = "Initial PostgreSQL database name."
  type        = string
  default     = "myconnect"
}

variable "db_username" {
  description = "PostgreSQL master username."
  type        = string
  default     = "myconnect"
}

variable "db_instance_class" {
  description = "RDS instance class. db.t4g.micro is small and low-cost."
  type        = string
  default     = "db.t4g.micro"
}

variable "postgres_engine_version" {
  description = "PostgreSQL engine version. Leave null to let AWS choose its current default."
  type        = string
  default     = null
}

variable "db_allocated_storage" {
  description = "Initial database storage in GiB."
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum database autoscaled storage in GiB."
  type        = number
  default     = 100
}

variable "db_backup_retention_days" {
  description = "RDS backup retention period in days."
  type        = number
  default     = 7
}

variable "db_deletion_protection" {
  description = "Whether to prevent accidental RDS deletion."
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Whether RDS skips a final snapshot on destroy."
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days."
  type        = number
  default     = 14
}
