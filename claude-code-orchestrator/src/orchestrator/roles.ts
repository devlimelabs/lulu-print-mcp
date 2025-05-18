import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:roles' });

/**
 * Agent role definitions
 */
export type AgentRole = {
  id: string;
  name: string;
  description: string;
  tasks: string[];
  promptPrefix: string;
};

/**
 * Predefined agent roles
 */
export const AGENT_ROLES: Record<string, AgentRole> = {
  ARCHITECT: {
    id: 'architect',
    name: 'Architect',
    description: 'Designs system architecture and high-level designs',
    tasks: [
      'Design system architecture',
      'Create high-level designs',
      'Define component interfaces',
      'Make architectural decisions',
      'Evaluate technology choices'
    ],
    promptPrefix: 'You are an expert software architect. Focus on designing high-quality, maintainable architectures and component relationships. Prioritize modularity, extensibility, and adherence to design principles.'
  },
  
  IMPLEMENTER: {
    id: 'implementer',
    name: 'Implementer',
    description: 'Implements code and functionality based on designs',
    tasks: [
      'Write code',
      'Implement features',
      'Fix bugs',
      'Refactor code',
      'Optimize performance'
    ],
    promptPrefix: 'You are an expert software developer. Focus on implementing clean, maintainable code that follows best practices. Ensure your code is thoroughly tested and robust.'
  },
  
  TESTER: {
    id: 'tester',
    name: 'Tester',
    description: 'Creates and runs tests to ensure code quality',
    tasks: [
      'Write unit tests',
      'Write integration tests',
      'Create test plans',
      'Perform QA',
      'Find edge cases'
    ],
    promptPrefix: 'You are an expert software tester. Focus on creating comprehensive test coverage and identifying edge cases. Ensure the code is robust and handles errors appropriately.'
  },
  
  REVIEWER: {
    id: 'reviewer',
    name: 'Reviewer',
    description: 'Reviews code for quality, style, and best practices',
    tasks: [
      'Review code',
      'Suggest improvements',
      'Enforce coding standards',
      'Find potential issues',
      'Optimize code'
    ],
    promptPrefix: 'You are an expert code reviewer. Focus on code quality, potential issues, and adherence to best practices. Look for security vulnerabilities, performance issues, and maintainability concerns.'
  },
  
  DEVOPS: {
    id: 'devops',
    name: 'DevOps',
    description: 'Sets up build, deployment, and infrastructure',
    tasks: [
      'Configure CI/CD',
      'Set up infrastructure',
      'Script deployments',
      'Manage dependencies',
      'Optimize build processes'
    ],
    promptPrefix: 'You are an expert DevOps engineer. Focus on setting up efficient build pipelines, deployments, and infrastructure. Ensure reproducibility, reliability, and security.'
  },
  
  DOCUMENTER: {
    id: 'documenter',
    name: 'Documenter',
    description: 'Creates documentation for code and systems',
    tasks: [
      'Write documentation',
      'Create API docs',
      'Document architecture',
      'Write user guides',
      'Create diagrams'
    ],
    promptPrefix: 'You are an expert technical writer. Focus on creating clear, comprehensive documentation that helps users understand the system. Use examples and diagrams where appropriate.'
  },
  
  GENERALIST: {
    id: 'generalist',
    name: 'Generalist',
    description: 'Performs all types of development tasks',
    tasks: [
      'Design',
      'Implement',
      'Test',
      'Review',
      'Document'
    ],
    promptPrefix: 'You are a full-stack software developer with broad expertise. Balance quality, maintainability, and efficiency in all tasks you undertake.'
  }
};

/**
 * Get the prompt prefix for a specific role
 * @param roleId - The role ID
 * @returns string - The prompt prefix or a default if the role is not found
 */
export function getRolePromptPrefix(roleId: string): string {
  const role = AGENT_ROLES[roleId.toUpperCase()] || AGENT_ROLES.GENERALIST;
  return role.promptPrefix;
}

/**
 * Get a role by ID
 * @param roleId - The role ID
 * @returns AgentRole - The role or the generalist role if not found
 */
export function getRole(roleId: string): AgentRole {
  const normalizedRoleId = roleId.toUpperCase();
  if (!AGENT_ROLES[normalizedRoleId]) {
    logger.warn(`Role ${roleId} not found, defaulting to GENERALIST`);
    return AGENT_ROLES.GENERALIST;
  }
  return AGENT_ROLES[normalizedRoleId];
}

/**
 * Get all available roles
 * @returns AgentRole[] - Array of all available roles
 */
export function getAllRoles(): AgentRole[] {
  return Object.values(AGENT_ROLES);
}