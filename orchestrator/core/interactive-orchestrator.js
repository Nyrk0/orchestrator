/**
 * Interactive Orchestrator - Story 1 Implementation
 * Provides guided interactive specification creation through structured questions
 */

const { Orchestrator } = require('./orchestrator');
const { OrchStateManager } = require('./state-manager');
const { TemplateEngine } = require('./template-engine');

class InteractiveOrchestrator extends Orchestrator {
  constructor(options = {}) {
    super(options);
    this.currentSession = null;
  }

  /**
   * Story 1: Interactive Specification Creation
   * Asks structured questions about phase objectives and guides spec creation
   */
  async createInteractiveSpec(phase, userInterface) {
    console.log(`🎯 Starting interactive specification creation for ${phase}`);
    
    this.currentSession = {
      phase,
      userInterface,
      specData: {
        phaseTitle: this.extractPhaseTitle(phase),
        objectives: [],
        requirements: [],
        dependencies: [],
        successCriteria: [],
        deliverables: [],
        risks: []
      },
      responses: {}
    };

    try {
      // Step 1: Ask about phase objectives
      await this.askPhaseObjectives();
      
      // Step 2: Ask about requirements
      await this.askRequirements();
      
      // Step 3: Ask about dependencies
      await this.askDependencies();
      
      // Step 4: Ask about success criteria
      await this.askSuccessCriteria();
      
      // Step 5: Ask about deliverables
      await this.askDeliverables();
      
      // Step 6: Ask about risks
      await this.askRisks();
      
      // Step 7: Review and confirm
      const confirmed = await this.reviewAndConfirm();
      
      if (confirmed) {
        // Generate specification document
        const result = await this.generateSpecification();
        
        // Request user approval
        const approved = await this.requestApproval();
        
        return {
          success: true,
          phase: this.currentSession.phase,
          specData: this.currentSession.specData,
          filePath: result.filePath,
          approved,
          interactive: true
        };
      } else {
        return {
          success: false,
          phase: this.currentSession.phase,
          error: 'Specification creation cancelled by user',
          interactive: true
        };
      }
      
    } catch (error) {
      return {
        success: false,
        phase: this.currentSession.phase,
        error: `Interactive specification failed: ${error.message}`,
        interactive: true
      };
    }
  }

  /**
   * Ask structured questions about phase objectives
   */
  async askPhaseObjectives() {
    const ui = this.currentSession.userInterface;
    const phase = this.currentSession.phase;
    
    await ui.display(`\n📋 Let's define the objectives for ${phase}`);
    await ui.display(`What are the main goals you want to achieve with this phase?`);
    await ui.display(`(Enter each objective on a separate line, press Enter twice when done)\n`);
    
    const objectives = [];
    let objectiveIndex = 1;
    
    while (true) {
      const objective = await ui.prompt(`Objective ${objectiveIndex}: `);
      
      if (!objective || objective.trim() === '') {
        if (objectives.length === 0) {
          await ui.display(`❌ Please provide at least one objective.`);
          continue;
        }
        break;
      }
      
      objectives.push(objective.trim());
      objectiveIndex++;
      
      // Ask if they want to add more
      if (objectives.length >= 3) {
        const addMore = await ui.confirm(`Add another objective? (${objectives.length} already added)`);
        if (!addMore) break;
      }
    }
    
    this.currentSession.specData.objectives = objectives;
    this.currentSession.responses.objectives = objectives;
    
    await ui.display(`\n✅ Added ${objectives.length} objectives:`);
    objectives.forEach((obj, idx) => {
      ui.display(`   ${idx + 1}. ${obj}`);
    });
  }

  /**
   * Ask about technical requirements
   */
  async askRequirements() {
    const ui = this.currentSession.userInterface;
    
    await ui.display(`\n🔧 Now let's define the technical requirements`);
    await ui.display(`What technical capabilities, constraints, or standards must this phase meet?`);
    
    const requirements = [];
    let reqIndex = 1;
    
    while (true) {
      const requirement = await ui.prompt(`Requirement ${reqIndex}: `);
      
      if (!requirement || requirement.trim() === '') {
        if (requirements.length === 0) {
          await ui.display(`❌ Please provide at least one requirement.`);
          continue;
        }
        break;
      }
      
      requirements.push(requirement.trim());
      reqIndex++;
      
      if (requirements.length >= 5) {
        const addMore = await ui.confirm(`Add another requirement? (${requirements.length} already added)`);
        if (!addMore) break;
      }
    }
    
    this.currentSession.specData.requirements = requirements;
    this.currentSession.responses.requirements = requirements;
  }

  /**
   * Ask about phase dependencies
   */
  async askDependencies() {
    const ui = this.currentSession.userInterface;
    const phase = this.currentSession.phase;
    
    await ui.display(`\n🔗 Let's identify dependencies for ${phase}`);
    await ui.display(`What other phases, systems, or resources does this phase depend on?`);
    
    const dependencies = [];
    
    // Suggest common dependencies based on phase number
    const phaseMatch = phase.match(/st(\d{2})/);
    if (phaseMatch) {
      const phaseNum = parseInt(phaseMatch[1]);
      if (phaseNum > 1) {
        const prevPhase = `st${(phaseNum - 1).toString().padStart(2, '0')}`;
        const dependsOnPrev = await ui.confirm(`Does this phase depend on ${prevPhase}?`);
        if (dependsOnPrev) {
          dependencies.push(`${prevPhase}-foundation`);
        }
      }
    }
    
    // Ask for additional dependencies
    while (true) {
      const dependency = await ui.prompt(`Additional dependency (or press Enter to finish): `);
      
      if (!dependency || dependency.trim() === '') {
        break;
      }
      
      dependencies.push(dependency.trim());
    }
    
    this.currentSession.specData.dependencies = dependencies;
    this.currentSession.responses.dependencies = dependencies;
    
    if (dependencies.length > 0) {
      await ui.display(`\n✅ Added ${dependencies.length} dependencies:`);
      dependencies.forEach((dep, idx) => {
        ui.display(`   ${idx + 1}. ${dep}`);
      });
    } else {
      await ui.display(`\n✅ No dependencies identified - this is a standalone phase`);
    }
  }

  /**
   * Ask about success criteria
   */
  async askSuccessCriteria() {
    const ui = this.currentSession.userInterface;
    
    await ui.display(`\n🎯 Let's define success criteria`);
    await ui.display(`How will you know when this phase is successfully completed?`);
    
    const successCriteria = [];
    let criteriaIndex = 1;
    
    while (true) {
      const criteria = await ui.prompt(`Success criterion ${criteriaIndex}: `);
      
      if (!criteria || criteria.trim() === '') {
        if (successCriteria.length === 0) {
          await ui.display(`❌ Please provide at least one success criterion.`);
          continue;
        }
        break;
      }
      
      successCriteria.push(criteria.trim());
      criteriaIndex++;
      
      if (successCriteria.length >= 3) {
        const addMore = await ui.confirm(`Add another success criterion? (${successCriteria.length} already added)`);
        if (!addMore) break;
      }
    }
    
    this.currentSession.specData.successCriteria = successCriteria;
    this.currentSession.responses.successCriteria = successCriteria;
  }

  /**
   * Ask about deliverables
   */
  async askDeliverables() {
    const ui = this.currentSession.userInterface;
    
    await ui.display(`\n📦 What deliverables will this phase produce?`);
    await ui.display(`Think about files, components, documentation, or features that will be created.`);
    
    const deliverables = [];
    let deliverableIndex = 1;
    
    while (true) {
      const deliverable = await ui.prompt(`Deliverable ${deliverableIndex}: `);
      
      if (!deliverable || deliverable.trim() === '') {
        if (deliverables.length === 0) {
          await ui.display(`❌ Please provide at least one deliverable.`);
          continue;
        }
        break;
      }
      
      deliverables.push(deliverable.trim());
      deliverableIndex++;
      
      if (deliverables.length >= 4) {
        const addMore = await ui.confirm(`Add another deliverable? (${deliverables.length} already added)`);
        if (!addMore) break;
      }
    }
    
    this.currentSession.specData.deliverables = deliverables;
    this.currentSession.responses.deliverables = deliverables;
  }

  /**
   * Ask about potential risks
   */
  async askRisks() {
    const ui = this.currentSession.userInterface;
    
    await ui.display(`\n⚠️  Let's identify potential risks and challenges`);
    await ui.display(`What could go wrong or cause delays in this phase?`);
    
    const risks = [];
    let riskIndex = 1;
    
    while (true) {
      const risk = await ui.prompt(`Risk/Challenge ${riskIndex} (or press Enter to skip): `);
      
      if (!risk || risk.trim() === '') {
        break;
      }
      
      risks.push(risk.trim());
      riskIndex++;
      
      if (risks.length >= 3) {
        const addMore = await ui.confirm(`Add another risk? (${risks.length} already added)`);
        if (!addMore) break;
      }
    }
    
    this.currentSession.specData.risks = risks;
    this.currentSession.responses.risks = risks;
    
    if (risks.length > 0) {
      await ui.display(`\n✅ Identified ${risks.length} potential risks to plan for`);
    }
  }

  /**
   * Review all collected information and confirm
   */
  async reviewAndConfirm() {
    const ui = this.currentSession.userInterface;
    const spec = this.currentSession.specData;
    
    await ui.display(`\n📋 SPECIFICATION REVIEW`);
    await ui.display(`Phase: ${spec.phaseTitle} (${this.currentSession.phase})`);
    await ui.display(`=`.repeat(50));
    
    await ui.display(`\n🎯 OBJECTIVES (${spec.objectives.length}):`);
    spec.objectives.forEach((obj, idx) => {
      ui.display(`   ${idx + 1}. ${obj}`);
    });
    
    await ui.display(`\n🔧 REQUIREMENTS (${spec.requirements.length}):`);
    spec.requirements.forEach((req, idx) => {
      ui.display(`   ${idx + 1}. ${req}`);
    });
    
    if (spec.dependencies.length > 0) {
      await ui.display(`\n🔗 DEPENDENCIES (${spec.dependencies.length}):`);
      spec.dependencies.forEach((dep, idx) => {
        ui.display(`   ${idx + 1}. ${dep}`);
      });
    }
    
    await ui.display(`\n🎯 SUCCESS CRITERIA (${spec.successCriteria.length}):`);
    spec.successCriteria.forEach((crit, idx) => {
      ui.display(`   ${idx + 1}. ${crit}`);
    });
    
    await ui.display(`\n📦 DELIVERABLES (${spec.deliverables.length}):`);
    spec.deliverables.forEach((del, idx) => {
      ui.display(`   ${idx + 1}. ${del}`);
    });
    
    if (spec.risks.length > 0) {
      await ui.display(`\n⚠️  RISKS IDENTIFIED (${spec.risks.length}):`);
      spec.risks.forEach((risk, idx) => {
        ui.display(`   ${idx + 1}. ${risk}`);
      });
    }
    
    await ui.display(`\n${'='.repeat(50)}`);
    
    const confirmed = await ui.confirm(`\nDoes this specification look correct and complete?`);
    
    if (!confirmed) {
      const revise = await ui.confirm(`Would you like to revise any section?`);
      if (revise) {
        // TODO: Implement revision workflow
        await ui.display(`📝 Revision workflow not yet implemented - please restart specification process`);
        return false;
      }
    }
    
    return confirmed;
  }

  /**
   * Generate the specification document with NSS methodology alignment
   */
  async generateSpecification() {
    const spec = this.currentSession.specData;
    const phase = this.currentSession.phase;
    
    // Add NSS methodology alignment
    spec.nssAlignment = this.generateNSSAlignment(spec);
    
    // Generate using template engine
    const result = await this.executeSpecCommand(phase, {
      specData: spec,
      interactive: true
    });
    
    return result;
  }

  /**
   * Generate NSS methodology alignment section
   */
  generateNSSAlignment(spec) {
    return {
      coreMethodology: "QUALIA•NSS Natural Surround Sound system methodology",
      alignmentPoints: [
        "Systematic specification-driven development approach",
        "User approval gates ensuring quality progression",
        "Hierarchical document precedence validation",
        "Iterative refinement through approval cycles"
      ],
      referenceDocument: "/dev/QUALIA-NSS-METHOD-DIAGRAMS.md"
    };
  }

  /**
   * Request user approval for the generated specification
   */
  async requestApproval() {
    const ui = this.currentSession.userInterface;
    
    await ui.display(`\n✅ Specification document generated successfully!`);
    await ui.display(`📄 File: ${this.currentSession.phase}/${this.currentSession.phase}-spec.md`);
    
    const approved = await ui.confirm(`\nDo you approve this specification for implementation?`);
    
    if (approved) {
      await this.processApproval(this.currentSession.phase, {
        type: 'spec',
        approved: true,
        comments: 'Interactive specification approved',
        interactive: true
      });
      
      await ui.display(`\n🎉 Specification approved! Ready to proceed to research phase.`);
    } else {
      await ui.display(`\n📝 Specification not approved. You can revise and resubmit when ready.`);
    }
    
    return approved;
  }

  /**
   * Allow user to iterate and refine the specification
   */
  async iterateSpecification() {
    const ui = this.currentSession.userInterface;
    
    await ui.display(`\n🔄 SPECIFICATION ITERATION`);
    await ui.display(`Which section would you like to revise?`);
    await ui.display(`1. Objectives`);
    await ui.display(`2. Requirements`);
    await ui.display(`3. Dependencies`);
    await ui.display(`4. Success Criteria`);
    await ui.display(`5. Deliverables`);
    await ui.display(`6. Risks`);
    
    const choice = await ui.prompt(`Select section to revise (1-6): `);
    
    switch (choice) {
      case '1':
        await this.askPhaseObjectives();
        break;
      case '2':
        await this.askRequirements();
        break;
      case '3':
        await this.askDependencies();
        break;
      case '4':
        await this.askSuccessCriteria();
        break;
      case '5':
        await this.askDeliverables();
        break;
      case '6':
        await this.askRisks();
        break;
      default:
        await ui.display(`Invalid selection. Please try again.`);
        return false;
    }
    
    return await ui.confirm(`Continue with other revisions?`);
  }
}

module.exports = { InteractiveOrchestrator };