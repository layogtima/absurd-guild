// ============================================
// STATE & DATA
// ============================================

let profileData = null;
let selectedToolCategory = 'All';

// ============================================
// THEME MANAGEMENT
// ============================================

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const html = document.documentElement;

const currentTheme = localStorage.getItem('theme') || 'dark';
html.classList.toggle('dark', currentTheme === 'dark');
updateThemeIcon();

function updateThemeIcon() {
    const isDark = html.classList.contains('dark');
    themeIcon.className = isDark ? 'fas fa-sun text-base text-primary' : 'fas fa-moon text-base text-primary';
}

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    const theme = html.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    updateThemeIcon();
});

// ============================================
// DATA LOADING
// ============================================

async function loadProfileData() {
    try {
        const response = await fetch('profile-data.json');
        profileData = await response.json();
        renderAll();
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

function renderAll() {
    renderHero();
    renderFeatured();
    renderProjects();
    renderTools();
    renderActivity();
    renderCampaigns();
    renderResources();
    setupScrollAnimations();
}

// Hero Section
function renderHero() {
    const { profile } = profileData;

    document.getElementById('nav-maker-name').textContent = profile.name.split(' ')[0];
    document.getElementById('hero-avatar').src = profile.avatar;
    document.getElementById('hero-avatar').alt = profile.name;
    document.getElementById('hero-name').textContent = profile.name;
    document.getElementById('hero-tagline').textContent = profile.tagline;
    document.getElementById('hero-obsession').textContent = profile.currentlyObsessedWith;

    // Skills
    const skillsContainer = document.getElementById('hero-skills');
    skillsContainer.innerHTML = profile.topSkills.map(skill => `
        <span class="bg-secondary border border-theme px-4 py-2 rounded-full text-sm font-semibold accent-orange-text hover:bg-orange-500 hover:text-white transition-all cursor-pointer">
            ${skill}
        </span>
    `).join('');

    // Social Links
    const socialContainer = document.getElementById('hero-social');
    socialContainer.innerHTML = profile.socialLinks.map(link => `
        <a href="${link.url}" target="_blank" rel="noopener"
            class="flex items-center gap-2 bg-secondary border-2 border-theme px-6 py-3 rounded-xl font-semibold text-primary hover:border-orange-500 hover:-translate-y-1 transition-all">
            <i class="${link.icon}"></i>
            <span>${link.name}</span>
        </a>
    `).join('');
}

// Featured Section
function renderFeatured() {
    const container = document.getElementById('featured-content');
    container.innerHTML = profileData.featured.map(item => {
        const imageOrEmoji = item.image
            ? `<img src="${item.image}" alt="${item.title}" class="w-full h-40 object-cover rounded-xl border border-theme" />`
            : `<div class="w-full h-40 bg-tertiary rounded-xl flex items-center justify-center text-6xl">${item.emoji}</div>`;

        return `
            <div class="bg-secondary border-2 border-theme rounded-2xl p-6 hover:border-orange-500 hover:-translate-y-1 transition-all">
                <div class="inline-block bg-tertiary accent-orange-text px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
                    ${item.type}
                </div>
                <div class="grid md:grid-cols-[200px,1fr] gap-6">
                    ${imageOrEmoji}
                    <div>
                        <h3 class="text-2xl font-bold text-primary mb-2">${item.title}</h3>
                        <p class="text-secondary leading-relaxed mb-3">
                            ${item.description}
                        </p>
                        <div class="flex flex-wrap gap-2">
                            ${item.tags.map(tag => `
                                <span class="bg-tertiary text-secondary px-3 py-1 rounded-lg text-xs font-semibold">${tag}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Projects Section
function renderProjects() {
    const container = document.getElementById('projects-content');
    container.innerHTML = profileData.projects.map(project => {
        const imageOrEmoji = project.image
            ? `<img src="${project.image}" alt="${project.name}" class="w-full h-full object-cover" />`
            : `<div class="w-full h-full bg-tertiary flex items-center justify-center text-6xl">${project.emoji}</div>`;

        const statusClass = `status-${project.status}`;
        const yearBadge = project.year
            ? `<div class="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                    <span class="text-white text-sm font-bold">${project.year}</span>
                </div>`
            : '';

        return `
            <div class="bg-secondary border-2 border-theme rounded-3xl overflow-hidden hover:border-orange-500 hover:-translate-y-2 transition-all cursor-pointer"
                onclick="openProjectModal('${project.id}')">
                <div class="aspect-video relative overflow-hidden">
                    ${imageOrEmoji}
                    ${yearBadge}
                    <div class="absolute top-4 right-4">
                        <span class="status-badge ${statusClass}">${project.status}</span>
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-primary mb-4">${project.name}</h3>
                    <div class="flex flex-wrap gap-2">
                        ${project.tags.map(tag => `
                            <span class="bg-tertiary text-secondary px-3 py-1 rounded-lg text-xs font-semibold">${tag}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Tools Section
function renderTools() {
    // Get unique categories
    const categories = ['All', ...new Set(profileData.tools.map(t => t.category))];

    // Render category filters
    const categoriesContainer = document.getElementById('tool-categories');
    categoriesContainer.innerHTML = categories.map(category => `
        <button onclick="filterTools('${category}')"
            class="px-4 py-2 rounded-lg transition-all font-semibold ${
                selectedToolCategory === category
                    ? 'accent-orange text-on-accent'
                    : 'bg-secondary text-primary border-2 border-theme hover:-translate-y-1'
            }">
            ${category}
        </button>
    `).join('');

    // Render tools
    renderToolsGrid();
}

function renderToolsGrid() {
    const container = document.getElementById('tools-content');
    const filteredTools = selectedToolCategory === 'All'
        ? profileData.tools
        : profileData.tools.filter(t => t.category === selectedToolCategory);

    container.innerHTML = filteredTools.map(tool => {
        const imageOrIcon = tool.image
            ? `<img src="${tool.image}" class="w-full h-full object-cover" alt="${tool.name}" />`
            : tool.emoji
                ? `<div class="w-full h-full bg-tertiary flex items-center justify-center text-6xl">${tool.emoji}</div>`
                : `<div class="w-full h-full bg-tertiary flex items-center justify-center">
                    <i class="${tool.icon} text-4xl accent-orange-text"></i>
                </div>`;

        return `
            <div class="bg-secondary border-2 border-theme rounded-2xl overflow-hidden hover:border-orange-500 hover:-translate-y-2 transition-all">
                <div class="h-52 bg-tertiary flex items-center justify-center">
                    ${imageOrIcon}
                </div>
                <div class="p-6">
                    <div class="inline-block bg-tertiary accent-orange-text px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-3">
                        ${tool.category}
                    </div>
                    <h3 class="text-2xl font-bold text-primary mb-3">${tool.name}</h3>
                    <p class="text-secondary leading-relaxed mb-4">
                        ${tool.description}
                    </p>
                    <div class="pt-4 border-t border-theme">
                        <p class="text-sm text-secondary">
                            <strong class="text-primary">Why:</strong> ${tool.usedFor}
                        </p>
                    </div>
                    ${tool.since ? `
                        <div class="text-xs text-secondary mt-3">
                            <i class="fas fa-calendar-alt mr-1"></i>
                            Using since ${tool.since}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterTools(category) {
    selectedToolCategory = category;
    renderTools();
}

// Activity Section
function renderActivity() {
    const container = document.getElementById('activity-content');

    // Combine all items with updatedAt dates
    const allItems = [
        ...profileData.projects.map(p => ({ ...p, type: 'project' })),
        ...profileData.featured.map(f => ({ ...f, type: 'featured', name: f.title }))
    ].filter(item => item.updatedAt)
     .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    container.innerHTML = allItems.map(item => {
        const timeAgo = getTimeAgo(item.updatedAt);
        const imageOrEmoji = item.image
            ? `<img src="${item.image}" alt="${item.name}" class="w-full h-40 object-cover rounded-xl border border-theme" />`
            : `<div class="w-full h-40 bg-tertiary rounded-xl flex items-center justify-center text-6xl">${item.emoji}</div>`;

        const actionLabel = item.status === 'completed' ? 'Completed Project' :
                           item.status === 'in-progress' ? 'Updated Project' :
                           item.status === 'planning' ? 'Planning Project' :
                           item.status === 'idea' ? 'New Idea' :
                           item.type === 'product' ? 'Added Product' :
                           item.type === 'livestream' ? 'Livestream' :
                           'Activity';

        return `
            <div class="grid grid-cols-[100px,1fr] gap-6 items-start">
                <div class="text-sm font-semibold text-secondary text-right pt-2">${timeAgo}</div>
                <div class="bg-secondary border-2 border-theme rounded-2xl p-6 hover:border-orange-500 hover:-translate-y-1 transition-all">
                    <div class="inline-block bg-tertiary accent-orange-text px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
                        ${actionLabel}
                    </div>
                    <div class="grid md:grid-cols-[200px,1fr] gap-6">
                        ${imageOrEmoji}
                        <div>
                            <h3 class="text-xl font-bold text-primary mb-2">${item.name || item.title}</h3>
                            <p class="text-secondary leading-relaxed text-sm mb-3">
                                ${item.fullDescription || item.description}
                            </p>
                            <div class="flex flex-wrap gap-2">
                                ${item.tags.map(tag => `
                                    <span class="bg-tertiary text-secondary px-2 py-1 rounded text-xs font-semibold">${tag}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Campaigns Section
function renderCampaigns() {
    const container = document.getElementById('campaigns-content');
    container.innerHTML = profileData.campaigns.map(campaign => `
        <div class="bg-secondary border-2 border-theme rounded-2xl overflow-hidden hover:border-orange-500 hover:-translate-y-2 transition-all">
            <div class="relative h-52 bg-tertiary">
                <img src="${campaign.image}" class="w-full h-full object-cover" alt="${campaign.title}" />
                <div class="absolute top-4 right-4 bg-transparent text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                    ${campaign.status}
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-2xl font-bold text-primary mb-3">${campaign.title}</h3>
                <p class="text-secondary leading-relaxed mb-4">
                    ${campaign.description}
                </p>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${campaign.tags.map(tag => `
                        <span class="bg-tertiary text-secondary px-3 py-1 rounded-lg text-xs font-semibold">${tag}</span>
                    `).join('')}
                </div>
                ${campaign.link ? `
                    <a href="${campaign.link}" target="_blank" rel="noopener"
                        class="inline-flex items-center gap-2 accent-orange-text font-semibold hover:gap-3 transition-all">
                        Learn More <i class="fas fa-arrow-right"></i>
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Resources Section
function renderResources() {
    const container = document.getElementById('resources-content');
    container.innerHTML = profileData.resources.map(resource => `
        <div class="bg-secondary border-2 border-theme rounded-2xl p-6 hover:border-orange-500 hover:-translate-y-2 transition-all">
            <div class="inline-flex items-center gap-2 bg-tertiary accent-orange-text px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
                <span>${resource.type}</span>
            </div>
            <div class="w-full h-48 bg-tertiary rounded-xl mb-4 flex items-center justify-center text-6xl">
                ${resource.emoji}
            </div>
            <h3 class="text-xl font-bold text-primary mb-3">${resource.title}</h3>
            <p class="text-secondary leading-relaxed text-sm mb-4">
                ${resource.description}
            </p>
            ${resource.link ? `
                <a href="${resource.link}" target="_blank" rel="noopener"
                    class="inline-flex items-center gap-2 accent-orange-text font-semibold text-sm hover:gap-3 transition-all">
                    Learn More <i class="fas fa-arrow-right"></i>
                </a>
            ` : ''}
        </div>
    `).join('');
}

// ============================================
// PROJECT MODAL
// ============================================

function openProjectModal(projectId) {
    const project = profileData.projects.find(p => p.id === projectId);
    if (!project) return;

    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    modalTitle.textContent = project.name;

    const imageOrEmoji = project.image
        ? `<img src="${project.image}" alt="${project.name}" class="w-full h-full object-cover" />`
        : `<div class="w-full h-full bg-tertiary flex items-center justify-center text-8xl">${project.emoji}</div>`;

    let content = `
        <!-- Project Image -->
        <div class="aspect-video rounded-2xl overflow-hidden">
            ${imageOrEmoji}
        </div>

        <!-- Description -->
        <div>
            <h4 class="font-bold text-xl text-primary mb-3 flex items-center gap-2">
                <i class="fas fa-info-circle accent-orange-text"></i>
                What It Is
            </h4>
            <p class="text-lg text-secondary leading-relaxed">
                ${project.fullDescription}
            </p>
        </div>
    `;

    if (project.problemSolved) {
        content += `
            <!-- Problem Solved -->
            <div>
                <h4 class="font-bold text-xl text-primary mb-3 flex items-center gap-2">
                    <i class="fas fa-lightbulb accent-orange-text"></i>
                    Problem Solved
                </h4>
                <p class="text-lg text-secondary leading-relaxed">
                    ${project.problemSolved}
                </p>
            </div>
        `;
    }

    if (project.toolsUsed && project.toolsUsed.length > 0) {
        content += `
            <!-- Tools Used -->
            <div>
                <h4 class="font-bold text-xl text-primary mb-3 flex items-center gap-2">
                    <i class="fas fa-tools accent-orange-text"></i>
                    Tools & Technologies
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${project.toolsUsed.map(tool => `
                        <div class="bg-tertiary rounded-xl p-4">
                            <div class="font-bold text-primary mb-1">${tool.tool}</div>
                            <div class="text-sm text-secondary">${tool.category}</div>
                            <div class="text-sm text-secondary mt-2">${tool.purpose}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    if (project.toolsNeeded && project.toolsNeeded.length > 0) {
        content += `
            <!-- Tools Needed -->
            <div>
                <h4 class="font-bold text-xl text-primary mb-3 flex items-center gap-2">
                    <i class="fas fa-tools accent-orange-text"></i>
                    Tools Needed
                </h4>
                <div class="flex flex-wrap gap-2">
                    ${project.toolsNeeded.map(tool => `
                        <span class="bg-tertiary px-3 py-2 rounded-lg text-sm text-primary">${tool}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    if (project.skillsLearned && project.skillsLearned.length > 0) {
        content += `
            <!-- Skills Learned -->
            <div>
                <h4 class="font-bold text-xl text-primary mb-3 flex items-center gap-2">
                    <i class="fas fa-graduation-cap accent-orange-text"></i>
                    Skills Learned
                </h4>
                <div class="flex flex-wrap gap-2">
                    ${project.skillsLearned.map(skill => `
                        <span class="bg-tertiary border border-theme px-3 py-2 rounded-lg text-sm text-primary flex items-center gap-2">
                            <i class="fas fa-check accent-orange-text text-xs"></i>
                            ${skill}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    if (project.skillsNeeded && project.skillsNeeded.length > 0) {
        content += `
            <!-- Skills Needed -->
            <div>
                <h4 class="font-bold text-xl text-primary mb-3 flex items-center gap-2">
                    <i class="fas fa-graduation-cap accent-orange-text"></i>
                    Skills to Learn
                </h4>
                <div class="flex flex-wrap gap-2">
                    ${project.skillsNeeded.map(skill => `
                        <span class="bg-tertiary px-3 py-2 rounded-lg text-sm text-primary">${skill}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    if (project.links && Object.keys(project.links).length > 0) {
        content += `
            <!-- Links -->
            <div>
                <h4 class="font-bold text-xl text-primary mb-3 flex items-center gap-2">
                    <i class="fas fa-link accent-orange-text"></i>
                    Resources
                </h4>
                <div class="flex flex-wrap gap-3">
                    ${Object.entries(project.links).map(([key, url]) => `
                        <a href="${url}" target="_blank" rel="noopener"
                            class="bg-tertiary px-4 py-2 rounded-lg hover:-translate-y-1 transition-all flex items-center gap-2">
                            <i class="fas fa-${key === 'github' ? 'code' : key === 'docs' ? 'book' : key === 'video' ? 'video' : 'external-link-alt'}"></i>
                            ${key.charAt(0).toUpperCase() + key.slice(1)}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Tags
    content += `
        <!-- Tags -->
        <div>
            <div class="flex flex-wrap gap-2">
                ${project.tags.map(tag => `
                    <span class="bg-tertiary text-secondary px-3 py-1 rounded-lg text-sm font-semibold">${tag}</span>
                `).join('')}
            </div>
        </div>
    `;

    modalContent.innerHTML = content;
    modal.classList.remove('hidden');
}

function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    modal.classList.add('hidden');
}

// Setup modal close handlers
document.getElementById('modal-close').addEventListener('click', closeProjectModal);
document.getElementById('project-modal').addEventListener('click', (e) => {
    if (e.target.id === 'project-modal') {
        closeProjectModal();
    }
});

// ============================================
// SCROLL ANIMATIONS
// ============================================

function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all cards
    const cards = document.querySelectorAll('.bg-secondary.border-2');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        observer.observe(card);
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return '1 month ago';
    return `${Math.floor(diffDays / 30)} months ago`;
}

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 150; // Account for sticky headers
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// CONSOLE EASTER EGG
// ============================================

console.log('%c👋 Hey there!', 'font-size: 24px; font-weight: bold;');
console.log('%cThis profile is built with the Absurd Industries Maker Profile System', 'font-size: 14px;');
console.log('%cCheck out https://absurd.industries to build your own!', 'font-size: 12px; color: #ff4500;');

// ============================================
// INITIALIZE APP
// ============================================

loadProfileData();
