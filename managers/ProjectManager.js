import { storage } from '../utils/storage.js';
import { generateId, downloadJson } from '../utils/helpers.js';
import { modalManager } from '../components/modal.js';
import { uiManager } from './UIManager.js';
import { cardManager } from './CardManager.js';
import { chatUIManager } from './ChatUIManager.js';
import { inputManager } from '../components/input.js';

class ProjectManager {
  constructor() {
    this.projects = new Map();
    this.activeProjectId = null;
    this.currentProjectNameEl = document.getElementById('current-project-name');
  }

  async initialize() {
    await this.loadSavedData();
  }

  async loadSavedData() {
    const savedProjects = storage.loadProjects();
    const savedActiveId = storage.loadActiveProjectId();

    if (savedProjects && savedProjects.size > 0) {
      this.projects = savedProjects;
      this.activeProjectId = savedActiveId && this.projects.has(savedActiveId) 
        ? savedActiveId 
        : this.projects.keys().next().value;
    } else {
      // Create a default project for first-time users, don't save yet.
      this.createNewProject('My First Project', false);
    }

    this.loadProject(this.activeProjectId);
  }

  loadProject(projectId) {
    this.activeProjectId = projectId;
    const project = this.getActiveProject();

    if (!project) {
      console.error(`Project with id ${projectId} not found.`);
      if (this.projects.size > 0) {
         this.loadProject(this.projects.keys().next().value);
      }
      return;
    }

    this.currentProjectNameEl.textContent = project.name;
    inputManager.setValue(project.concept || '');
    cardManager.renderAllCards();
    chatUIManager.renderChatHistory();

    storage.saveActiveProjectId(this.activeProjectId);
  }

  switchProject(projectId) {
    if (projectId === this.activeProjectId) return;
    this.saveActiveProjectData(); // Save current project before switching
    this.loadProject(projectId);
    uiManager.showSuccessNotification(`Switched to project: ${this.getActiveProject().name}`);
  }

  createNewProject(name, setActive = true) {
    const newId = `proj_${Date.now()}`;
    const newProject = {
      id: newId,
      name: name,
      concept: '',
      cards: [],
      chatHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.projects.set(newId, newProject);
    
    if (setActive) {
      if(this.activeProjectId) {
        this.saveActiveProjectData(); // Save previous project before switching
      }
      this.switchProject(newId);
      this.saveData();
      uiManager.showSuccessNotification(`Project "${name}" created!`);
    } else {
       this.activeProjectId = newId;
    }
  }
  
  renameProject(projectId, newName) {
    const project = this.projects.get(projectId);
    if (project) {
      project.name = newName;
      project.updatedAt = Date.now();
      this.projects.set(projectId, project);
      if (projectId === this.activeProjectId) {
        this.currentProjectNameEl.textContent = newName;
      }
      this.saveData();
    }
  }

  updateActiveProjectName(newName) {
    const project = this.getActiveProject();
    if (project) {
        project.name = newName;
        this.currentProjectNameEl.textContent = newName;
        this.saveActiveProjectData();
    }
  }

  deleteProject(projectId) {
    if (this.projects.size <= 1) {
      uiManager.showErrorNotification("Cannot delete the only project.");
      return;
    }
    this.projects.delete(projectId);
    if (this.activeProjectId === projectId) {
      this.activeProjectId = this.projects.keys().next().value;
      this.loadProject(this.activeProjectId);
    }
    this.saveData();
    uiManager.showSuccessNotification("Project deleted.");
  }

  getActiveProject() {
    return this.projects.get(this.activeProjectId);
  }

  saveActiveProjectData() {
    const project = this.getActiveProject();
    if (project) {
        project.updatedAt = Date.now();
        project.concept = inputManager.getValue();
        this.projects.set(this.activeProjectId, project);
        this.saveData();
    }
  }

  saveData() {
    storage.saveProjects(this.projects);
    storage.saveActiveProjectId(this.activeProjectId);
  }

  exportProject() {
    const project = this.getActiveProject();
    if (!project) return;

    const exportData = {
      version: '1.0.0',
      timestamp: Date.now(),
      project: project
    };

    const filename = `idea-forge-${project.name.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.json`;
    downloadJson(exportData, filename);
    
    uiManager.showSuccessNotification('Project data exported successfully!');
  }

  async showProjectManager() {
    const result = await modalManager.showProjectManager({
        projects: Array.from(this.projects.values()),
        activeProjectId: this.activeProjectId
    });

    if (!result) return;

    switch (result.action) {
        case 'switch':
            this.switchProject(result.id);
            break;
        case 'create':
            this.createNewProject(result.name);
            break;
        case 'rename':
            this.renameProject(result.id, result.name);
            break;
        case 'delete':
            this.deleteProject(result.id);
            break;
    }
  }
}

export const projectManager = new ProjectManager();