import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { OrchestratorMonitor } from "./monitor.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:workflows' });

/**
 * Workflow step type
 */
export type WorkflowStep = {
  task: string;
  role: string;
  priority: number;
  dependencies?: string[];
};

/**
 * Workflow template type
 */
export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
};

/**
 * Predefined workflow templates
 */
export const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
  CODE_REVIEW: {
    id: 'code-review',
    name: 'Code Review',
    description: 'Comprehensive code review workflow',
    steps: [
      {
        task: 'Analyze code structure and organization',
        role: 'architect',
        priority: 7
      },
      {
        task: 'Find potential bugs and issues',
        role: 'reviewer',
        priority: 8
      },
      {
        task: 'Check for security vulnerabilities',
        role: 'reviewer',
        priority: 9
      },
      {
        task: 'Evaluate performance and optimization opportunities',
        role: 'reviewer',
        priority: 6
      },
      {
        task: 'Review documentation and code comments',
        role: 'documenter',
        priority: 5
      },
      {
        task: 'Generate a comprehensive code review report',
        role: 'reviewer',
        priority: 7,
        dependencies: [0, 1, 2, 3, 4] // Depends on all previous steps
      }
    ]
  },
  
  FEATURE_DEVELOPMENT: {
    id: 'feature-development',
    name: 'Feature Development',
    description: 'End-to-end feature development workflow',
    steps: [
      {
        task: 'Design feature architecture and interfaces',
        role: 'architect',
        priority: 9
      },
      {
        task: 'Create implementation plan',
        role: 'implementer',
        priority: 8,
        dependencies: [0]
      },
      {
        task: 'Implement core functionality',
        role: 'implementer',
        priority: 7,
        dependencies: [1]
      },
      {
        task: 'Write unit tests',
        role: 'tester',
        priority: 6,
        dependencies: [2]
      },
      {
        task: 'Write integration tests',
        role: 'tester',
        priority: 6,
        dependencies: [2]
      },
      {
        task: 'Document the feature',
        role: 'documenter',
        priority: 5,
        dependencies: [2]
      },
      {
        task: 'Review implementation',
        role: 'reviewer',
        priority: 7,
        dependencies: [2, 3, 4, 5]
      },
      {
        task: 'Create PR description',
        role: 'documenter',
        priority: 6,
        dependencies: [6]
      }
    ]
  },
  
  BUG_FIX: {
    id: 'bug-fix',
    name: 'Bug Fix',
    description: 'Workflow for fixing and verifying bugs',
    steps: [
      {
        task: 'Analyze the bug and identify root cause',
        role: 'reviewer',
        priority: 9
      },
      {
        task: 'Design fix approach',
        role: 'architect',
        priority: 8,
        dependencies: [0]
      },
      {
        task: 'Implement the fix',
        role: 'implementer',
        priority: 7,
        dependencies: [1]
      },
      {
        task: 'Write tests to verify fix',
        role: 'tester',
        priority: 8,
        dependencies: [2]
      },
      {
        task: 'Update documentation if needed',
        role: 'documenter',
        priority: 5,
        dependencies: [2]
      },
      {
        task: 'Create PR with bug fix description',
        role: 'documenter',
        priority: 6,
        dependencies: [3, 4]
      }
    ]
  },
  
  CODE_REFACTORING: {
    id: 'code-refactoring',
    name: 'Code Refactoring',
    description: 'Workflow for code refactoring with safety checks',
    steps: [
      {
        task: 'Analyze current code structure and issues',
        role: 'reviewer',
        priority: 8
      },
      {
        task: 'Design refactoring approach',
        role: 'architect',
        priority: 9,
        dependencies: [0]
      },
      {
        task: 'Create test suite to verify behavior',
        role: 'tester',
        priority: 8,
        dependencies: [0]
      },
      {
        task: 'Implement refactoring',
        role: 'implementer',
        priority: 7,
        dependencies: [1, 2]
      },
      {
        task: 'Verify tests still pass',
        role: 'tester',
        priority: 8,
        dependencies: [3]
      },
      {
        task: 'Update documentation',
        role: 'documenter',
        priority: 6,
        dependencies: [3]
      },
      {
        task: 'Create PR with refactoring description',
        role: 'documenter',
        priority: 7,
        dependencies: [4, 5]
      }
    ]
  }
};

/**
 * Workflow execution class
 */
export class WorkflowExecution {
  private monitor: OrchestratorMonitor;
  private template: WorkflowTemplate;
  private processIds: string[] = [];
  private workingDirectory?: string;
  private customTasks: Record<string, string> = {};
  
  /**
   * Constructor
   * @param monitor - Orchestrator monitor
   * @param templateId - Workflow template ID
   * @param workingDirectory - Working directory for all tasks
   */
  constructor(
    monitor: OrchestratorMonitor,
    templateId: string,
    workingDirectory?: string
  ) {
    this.monitor = monitor;
    
    // Get template
    const template = WORKFLOW_TEMPLATES[templateId.toUpperCase()];
    if (!template) {
      throw new Error(`Workflow template ${templateId} not found`);
    }
    
    this.template = template;
    this.workingDirectory = workingDirectory;
    
    logger.info(`Created workflow execution for template ${templateId}`);
  }
  
  /**
   * Get all available workflow templates
   * @returns WorkflowTemplate[] - Array of all available workflow templates
   */
  static getAllTemplates(): WorkflowTemplate[] {
    return Object.values(WORKFLOW_TEMPLATES);
  }
  
  /**
   * Get a workflow template by ID
   * @param templateId - Template ID
   * @returns WorkflowTemplate | undefined - Template or undefined if not found
   */
  static getTemplate(templateId: string): WorkflowTemplate | undefined {
    return WORKFLOW_TEMPLATES[templateId.toUpperCase()];
  }
  
  /**
   * Set a custom task description for a step index
   * @param stepIndex - Step index
   * @param taskDescription - Custom task description
   */
  setCustomTask(stepIndex: number, taskDescription: string): void {
    this.customTasks[stepIndex.toString()] = taskDescription;
  }
  
  /**
   * Execute the workflow
   * @returns string[] - Array of process IDs
   */
  execute(): string[] {
    this.processIds = [];
    
    // Submit all steps
    for (let i = 0; i < this.template.steps.length; i++) {
      const step = this.template.steps[i];
      
      // Get task description (custom or default)
      const task = this.customTasks[i.toString()] || step.task;
      
      // Resolve dependencies to actual process IDs
      const dependencies = step.dependencies?.map(depIndex => {
        if (depIndex < 0 || depIndex >= i || depIndex >= this.processIds.length) {
          logger.warn(`Invalid dependency index ${depIndex} for step ${i}`);
          return undefined;
        }
        return this.processIds[depIndex];
      }).filter((id): id is string => id !== undefined) || [];
      
      // Submit the task
      const processId = this.monitor.submitTask(
        task,
        step.priority,
        step.role,
        this.workingDirectory,
        dependencies
      );
      
      this.processIds.push(processId);
    }
    
    logger.info(`Executed workflow with ${this.processIds.length} steps`);
    
    return this.processIds;
  }
  
  /**
   * Get the process IDs for this workflow
   * @returns string[] - Array of process IDs
   */
  getProcessIds(): string[] {
    return [...this.processIds];
  }
  
  /**
   * Get the template used for this workflow
   * @returns WorkflowTemplate - The workflow template
   */
  getTemplate(): WorkflowTemplate {
    return this.template;
  }
}