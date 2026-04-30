output "alb_dns_name" {
  description = "Public DNS name of the application load balancer."
  value       = aws_lb.app.dns_name
}

output "app_url" {
  description = "HTTP URL for the deployed application."
  value       = "http://${aws_lb.app.dns_name}"
}

output "ecr_repository_url" {
  description = "ECR repository URL to push the application image to."
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name."
  value       = aws_ecs_service.app.name
}

output "rds_endpoint" {
  description = "Private RDS PostgreSQL endpoint."
  value       = aws_db_instance.postgres.endpoint
}

output "database_url_secret_arn" {
  description = "Secrets Manager ARN containing DATABASE_URL."
  value       = aws_secretsmanager_secret.database_url.arn
}

output "openai_api_key_secret_arn" {
  description = "Secrets Manager ARN containing OPENAI_API_KEY."
  value       = aws_secretsmanager_secret.openai_api_key.arn
}
