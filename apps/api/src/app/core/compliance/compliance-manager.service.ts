import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  requirements: ComplianceRequirement[];
  enabled: boolean;
  lastAssessment?: Date;
  nextAssessment?: Date;
  complianceScore: number;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  implemented: boolean;
  evidence: string[];
  lastReview: Date;
  reviewer: string;
  notes?: string;
}

export interface DataProcessingRecord {
  id: string;
  purpose: string;
  dataTypes: string[];
  legalBasis: string;
  retention: string;
  processors: string[];
  transfers: DataTransfer[];
  subjectRights: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DataTransfer {
  recipient: string;
  country: string;
  safeguards: string[];
  date: Date;
}

export interface ComplianceAudit {
  id: string;
  framework: string;
  auditor: string;
  startDate: Date;
  endDate?: Date;
  scope: string[];
  findings: AuditFinding[];
  status: 'planned' | 'in_progress' | 'completed';
  overallRating: 'compliant' | 'minor_issues' | 'major_issues' | 'non_compliant';
}

export interface AuditFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  evidence: string;
  recommendation: string;
  deadline?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedDate?: Date;
}

@Injectable()
export class ComplianceManagerService {
  private readonly logger = new Logger(ComplianceManagerService.name);
  private frameworks: ComplianceFramework[] = [];
  private dataProcessingRecords: DataProcessingRecord[] = [];
  private audits: ComplianceAudit[] = [];

  constructor(private configService: ConfigService) {
    this.initializeFrameworks();
  }

  private initializeFrameworks(): void {
    this.frameworks = [
      this.createGDPRFramework(),
      this.createSOC2Framework(),
      this.createHIPAAFramework(),
      this.createCCPAFramework()
    ];

    this.logger.log(`Initialized ${this.frameworks.length} compliance frameworks`);
  }

  private createGDPRFramework(): ComplianceFramework {
    return {
      id: 'gdpr',
      name: 'General Data Protection Regulation (GDPR)',
      description: 'EU data protection regulation compliance',
      enabled: true,
      complianceScore: 85,
      requirements: [
        {
          id: 'gdpr_001',
          title: 'Data Processing Records',
          description: 'Maintain records of processing activities',
          category: 'Documentation',
          mandatory: true,
          implemented: true,
          evidence: ['processing_records.pdf', 'data_flow_diagram.pdf'],
          lastReview: new Date('2024-01-15'),
          reviewer: 'compliance_officer'
        },
        {
          id: 'gdpr_002',
          title: 'Data Subject Rights',
          description: 'Implement procedures for data subject rights',
          category: 'Rights Management',
          mandatory: true,
          implemented: true,
          evidence: ['rights_procedure.pdf', 'request_portal.html'],
          lastReview: new Date('2024-01-20'),
          reviewer: 'legal_team'
        },
        {
          id: 'gdpr_003',
          title: 'Data Protection by Design',
          description: 'Implement privacy by design principles',
          category: 'Technical Measures',
          mandatory: true,
          implemented: false,
          evidence: [],
          lastReview: new Date('2024-01-10'),
          reviewer: 'technical_lead',
          notes: 'Implementation in progress'
        },
        {
          id: 'gdpr_004',
          title: 'Breach Notification',
          description: 'Procedures for data breach notification',
          category: 'Incident Response',
          mandatory: true,
          implemented: true,
          evidence: ['breach_procedure.pdf', 'notification_template.doc'],
          lastReview: new Date('2024-01-25'),
          reviewer: 'security_team'
        },
        {
          id: 'gdpr_005',
          title: 'Data Retention Policies',
          description: 'Implement data retention and deletion policies',
          category: 'Data Lifecycle',
          mandatory: true,
          implemented: true,
          evidence: ['retention_policy.pdf', 'deletion_procedures.pdf'],
          lastReview: new Date('2024-01-18'),
          reviewer: 'data_officer'
        }
      ]
    };
  }

  private createSOC2Framework(): ComplianceFramework {
    return {
      id: 'soc2',
      name: 'SOC 2 Type II',
      description: 'Service Organization Control 2 compliance',
      enabled: true,
      complianceScore: 92,
      requirements: [
        {
          id: 'soc2_001',
          title: 'Security Controls',
          description: 'Implement comprehensive security controls',
          category: 'Security',
          mandatory: true,
          implemented: true,
          evidence: ['security_policy.pdf', 'access_controls.pdf'],
          lastReview: new Date('2024-01-12'),
          reviewer: 'security_auditor'
        },
        {
          id: 'soc2_002',
          title: 'Availability Controls',
          description: 'Ensure system availability and performance',
          category: 'Availability',
          mandatory: true,
          implemented: true,
          evidence: ['monitoring_setup.pdf', 'sla_reports.pdf'],
          lastReview: new Date('2024-01-22'),
          reviewer: 'operations_manager'
        },
        {
          id: 'soc2_003',
          title: 'Processing Integrity',
          description: 'Ensure complete and accurate processing',
          category: 'Processing Integrity',
          mandatory: false,
          implemented: true,
          evidence: ['validation_controls.pdf', 'error_handling.pdf'],
          lastReview: new Date('2024-01-14'),
          reviewer: 'quality_assurance'
        },
        {
          id: 'soc2_004',
          title: 'Confidentiality Controls',
          description: 'Protect confidential information',
          category: 'Confidentiality',
          mandatory: false,
          implemented: true,
          evidence: ['encryption_policy.pdf', 'access_logs.pdf'],
          lastReview: new Date('2024-01-16'),
          reviewer: 'security_team'
        }
      ]
    };
  }

  private createHIPAAFramework(): ComplianceFramework {
    return {
      id: 'hipaa',
      name: 'Health Insurance Portability and Accountability Act (HIPAA)',
      description: 'Healthcare data protection compliance',
      enabled: false, // Not applicable for this business
      complianceScore: 0,
      requirements: []
    };
  }

  private createCCPAFramework(): ComplianceFramework {
    return {
      id: 'ccpa',
      name: 'California Consumer Privacy Act (CCPA)',
      description: 'California privacy law compliance',
      enabled: true,
      complianceScore: 78,
      requirements: [
        {
          id: 'ccpa_001',
          title: 'Privacy Notice',
          description: 'Provide comprehensive privacy notice',
          category: 'Transparency',
          mandatory: true,
          implemented: true,
          evidence: ['privacy_notice.pdf', 'website_privacy_page.html'],
          lastReview: new Date('2024-01-08'),
          reviewer: 'legal_counsel'
        },
        {
          id: 'ccpa_002',
          title: 'Consumer Rights',
          description: 'Implement consumer rights requests',
          category: 'Rights Management',
          mandatory: true,
          implemented: false,
          evidence: [],
          lastReview: new Date('2024-01-05'),
          reviewer: 'compliance_officer',
          notes: 'Portal development required'
        }
      ]
    };
  }

  async assessCompliance(frameworkId: string): Promise<ComplianceFramework> {
    const framework = this.frameworks.find(f => f.id === frameworkId);
    
    if (!framework) {
      throw new Error(`Framework not found: ${frameworkId}`);
    }

    const totalRequirements = framework.requirements.length;
    const implementedRequirements = framework.requirements.filter(r => r.implemented).length;
    const mandatoryRequirements = framework.requirements.filter(r => r.mandatory).length;
    const implementedMandatory = framework.requirements.filter(r => r.mandatory && r.implemented).length;

    // Calculate compliance score
    let score = 0;
    if (totalRequirements > 0) {
      const mandatoryWeight = 0.8;
      const optionalWeight = 0.2;
      
      const mandatoryScore = mandatoryRequirements > 0 ? (implementedMandatory / mandatoryRequirements) : 1;
      const optionalScore = (totalRequirements - mandatoryRequirements) > 0 ? 
        ((implementedRequirements - implementedMandatory) / (totalRequirements - mandatoryRequirements)) : 1;
      
      score = Math.round((mandatoryScore * mandatoryWeight + optionalScore * optionalWeight) * 100);
    }

    framework.complianceScore = score;
    framework.lastAssessment = new Date();
    framework.nextAssessment = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    this.logger.log(`Compliance assessment completed for ${frameworkId}: ${score}%`);
    return framework;
  }

  async updateRequirement(
    frameworkId: string, 
    requirementId: string, 
    updates: Partial<ComplianceRequirement>
  ): Promise<boolean> {
    const framework = this.frameworks.find(f => f.id === frameworkId);
    
    if (!framework) {
      return false;
    }

    const requirement = framework.requirements.find(r => r.id === requirementId);
    
    if (!requirement) {
      return false;
    }

    Object.assign(requirement, updates);
    requirement.lastReview = new Date();

    this.logger.log(`Requirement updated: ${frameworkId}/${requirementId}`);
    return true;
  }

  async createDataProcessingRecord(record: Omit<DataProcessingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newRecord: DataProcessingRecord = {
      id: `dpr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...record,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.dataProcessingRecords.push(newRecord);
    this.logger.log(`Data processing record created: ${newRecord.id}`);
    
    return newRecord.id;
  }

  async updateDataProcessingRecord(id: string, updates: Partial<DataProcessingRecord>): Promise<boolean> {
    const record = this.dataProcessingRecords.find(r => r.id === id);
    
    if (!record) {
      return false;
    }

    Object.assign(record, updates);
    record.updatedAt = new Date();

    this.logger.log(`Data processing record updated: ${id}`);
    return true;
  }

  async getDataProcessingRecords(): Promise<DataProcessingRecord[]> {
    return [...this.dataProcessingRecords];
  }

  async createAudit(audit: Omit<ComplianceAudit, 'id' | 'findings'>): Promise<string> {
    const newAudit: ComplianceAudit = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...audit,
      findings: []
    };

    this.audits.push(newAudit);
    this.logger.log(`Compliance audit created: ${newAudit.id}`);
    
    return newAudit.id;
  }

  async addAuditFinding(auditId: string, finding: Omit<AuditFinding, 'id'>): Promise<string> {
    const audit = this.audits.find(a => a.id === auditId);
    
    if (!audit) {
      throw new Error(`Audit not found: ${auditId}`);
    }

    const newFinding: AuditFinding = {
      id: `finding_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...finding
    };

    audit.findings.push(newFinding);
    this.logger.log(`Audit finding added: ${auditId}/${newFinding.id}`);
    
    return newFinding.id;
  }

  async resolveFinding(auditId: string, findingId: string, resolvedBy: string): Promise<boolean> {
    const audit = this.audits.find(a => a.id === auditId);
    
    if (!audit) {
      return false;
    }

    const finding = audit.findings.find(f => f.id === findingId);
    
    if (!finding) {
      return false;
    }

    finding.resolved = true;
    finding.resolvedBy = resolvedBy;
    finding.resolvedDate = new Date();

    this.logger.log(`Audit finding resolved: ${auditId}/${findingId} by ${resolvedBy}`);
    return true;
  }

  async generateComplianceReport(): Promise<any> {
    const report = {
      timestamp: new Date().toISOString(),
      frameworks: [],
      overallScore: 0,
      summary: {
        totalFrameworks: 0,
        enabledFrameworks: 0,
        averageScore: 0,
        pendingRequirements: 0,
        recentAudits: 0
      },
      recommendations: []
    };

    let totalScore = 0;
    let enabledCount = 0;

    for (const framework of this.frameworks) {
      if (framework.enabled) {
        await this.assessCompliance(framework.id);
        
        report.frameworks.push({
          id: framework.id,
          name: framework.name,
          score: framework.complianceScore,
          lastAssessment: framework.lastAssessment,
          pendingRequirements: framework.requirements.filter(r => !r.implemented).length
        });

        totalScore += framework.complianceScore;
        enabledCount++;
      }
    }

    report.summary.totalFrameworks = this.frameworks.length;
    report.summary.enabledFrameworks = enabledCount;
    report.summary.averageScore = enabledCount > 0 ? Math.round(totalScore / enabledCount) : 0;
    report.summary.pendingRequirements = this.frameworks
      .filter(f => f.enabled)
      .reduce((sum, f) => sum + f.requirements.filter(r => !r.implemented).length, 0);
    report.summary.recentAudits = this.audits.filter(a => 
      a.startDate.getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000
    ).length;

    // Generate recommendations
    report.recommendations = this.generateRecommendations();

    this.logger.log(`Compliance report generated: Overall score ${report.summary.averageScore}%`);
    return report;
  }

  async handleDataSubjectRequest(
    type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction',
    subjectId: string,
    details: any
  ): Promise<string> {
    const requestId = `dsr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    this.logger.log(`Data subject request received: ${type} for ${subjectId} (${requestId})`);

    // In production, this would trigger appropriate workflows
    switch (type) {
      case 'access':
        // Compile all data for the subject
        break;
      case 'rectification':
        // Update incorrect data
        break;
      case 'erasure':
        // Delete or anonymize data
        break;
      case 'portability':
        // Export data in machine-readable format
        break;
      case 'restriction':
        // Restrict processing of data
        break;
    }

    return requestId;
  }

  async checkRetentionPolicies(): Promise<{ expired: number; toDelete: string[] }> {
    const now = new Date();
    const toDelete: string[] = [];
    let expired = 0;

    // Check data processing records for expired retention periods
    for (const record of this.dataProcessingRecords) {
      // Parse retention period (e.g., "7 years", "2 months")
      const retentionMatch = record.retention.match(/(\d+)\s*(years?|months?|days?)/i);
      
      if (retentionMatch) {
        const amount = parseInt(retentionMatch[1]);
        const unit = retentionMatch[2].toLowerCase();
        
        let retentionMs = 0;
        if (unit.startsWith('year')) {
          retentionMs = amount * 365 * 24 * 60 * 60 * 1000;
        } else if (unit.startsWith('month')) {
          retentionMs = amount * 30 * 24 * 60 * 60 * 1000;
        } else if (unit.startsWith('day')) {
          retentionMs = amount * 24 * 60 * 60 * 1000;
        }

        if (now.getTime() - record.createdAt.getTime() > retentionMs) {
          toDelete.push(record.id);
          expired++;
        }
      }
    }

    if (expired > 0) {
      this.logger.warn(`Found ${expired} records past retention period`);
    }

    return { expired, toDelete };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    for (const framework of this.frameworks.filter(f => f.enabled)) {
      if (framework.complianceScore < 80) {
        recommendations.push(`Improve compliance for ${framework.name} (current: ${framework.complianceScore}%)`);
      }

      const outdatedReviews = framework.requirements.filter(r => 
        new Date().getTime() - r.lastReview.getTime() > 90 * 24 * 60 * 60 * 1000
      );

      if (outdatedReviews.length > 0) {
        recommendations.push(`Review ${outdatedReviews.length} outdated requirements in ${framework.name}`);
      }

      const unimplemented = framework.requirements.filter(r => !r.implemented);
      if (unimplemented.length > 0) {
        recommendations.push(`Implement ${unimplemented.length} pending requirements in ${framework.name}`);
      }
    }

    // Check for missing documentation
    if (this.dataProcessingRecords.length === 0) {
      recommendations.push('Create data processing records as required by GDPR');
    }

    // Check for recent audits
    const recentAudits = this.audits.filter(a => 
      a.startDate.getTime() > Date.now() - 365 * 24 * 60 * 60 * 1000
    ).length;

    if (recentAudits === 0) {
      recommendations.push('Schedule compliance audits for all enabled frameworks');
    }

    return recommendations;
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  private async dailyComplianceCheck(): Promise<void> {
    this.logger.log('Running daily compliance check');

    // Check retention policies
    const retentionCheck = await this.checkRetentionPolicies();
    if (retentionCheck.expired > 0) {
      this.logger.warn(`Found ${retentionCheck.expired} records past retention period`);
    }

    // Check for overdue requirements
    for (const framework of this.frameworks.filter(f => f.enabled)) {
      const overdue = framework.requirements.filter(r => 
        !r.implemented && 
        new Date().getTime() - r.lastReview.getTime() > 30 * 24 * 60 * 60 * 1000
      );

      if (overdue.length > 0) {
        this.logger.warn(`${framework.name} has ${overdue.length} overdue requirements`);
      }
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  private async monthlyComplianceAssessment(): Promise<void> {
    this.logger.log('Running monthly compliance assessment');

    for (const framework of this.frameworks.filter(f => f.enabled)) {
      await this.assessCompliance(framework.id);
    }

    const report = await this.generateComplianceReport();
    this.logger.log('Monthly compliance report generated:', {
      averageScore: report.summary.averageScore,
      pendingRequirements: report.summary.pendingRequirements
    });
  }

  getFrameworks(): ComplianceFramework[] {
    return [...this.frameworks];
  }

  getAudits(): ComplianceAudit[] {
    return [...this.audits];
  }
}