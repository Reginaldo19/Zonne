// Zonne.js - Social Sphere (Sem Login)

// Variáveis Globais
let currentUser = null;
let currentUserId = null;
let allUsersCache = {};
let currentMedia = [];
let currentStoryMedia = null;
let currentAvatar = null;
let currentCover = null;
let currentFeeling = null;
let taggedPeople = [];
let currentLocation = null;
let activeUserStories = [];
let currentStoryIndex = 0;
let storyViewTimeout = null;
let postsListenerUnsub = null;
let notificationsListener = null;
let searchTimeout = null;
let searchFilter = 'all';
let currentUserProfileData = null;
let currentEditingPostId = null;

// Configurações
const REACTIONS = {
    '👍': { label: 'Gostei', color: 'text-blue-600', icon: 'thumbs-up' },
    '❤️': { label: 'Amei', color: 'text-red-600', icon: 'heart' },
    '😂': { label: 'Haha', color: 'text-yellow-600', icon: 'laugh' },
    '😮': { label: 'Uau', color: 'text-purple-600', icon: 'surprise' },
    '😢': { label: 'Triste', color: 'text-blue-400', icon: 'sad-tear' },
    '🔥': { label: 'Fogo', color: 'text-orange-600', icon: 'fire' },
    '👎': { label: 'Não Gostei', color: 'text-gray-600', icon: 'thumbs-down' }
};

const FEELINGS = [
    { emoji: '😊', label: 'Feliz' },
    { emoji: '😢', label: 'Triste' },
    { emoji: '😠', label: 'Bravo' },
    { emoji: '😍', label: 'Apaixonado' },
    { emoji: '😴', label: 'Cansado' },
    { emoji: '🤒', label: 'Doente' },
    { emoji: '🎉', label: 'Comemorando' },
    { emoji: '✈️', label: 'Viajando' },
    { emoji: '💼', label: 'Focado' },
    { emoji: '🎮', label: 'Jogando' },
    { emoji: '🎵', label: 'Ouvindo música' },
    { emoji: '🎬', label: 'Assistindo' },
    { emoji: '🍕', label: 'Comendo' },
    { emoji: '☕', label: 'Tomando café' },
    { emoji: '🎂', label: 'Celebrando' },
    { emoji: '💻', label: 'Trabalhando' },
    { emoji: '📚', label: 'Estudando' },
    { emoji: '🏋️', label: 'Malhando' }
];

// Inicializar Aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Mostrar loading
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.classList.remove('hidden');
    
    setTimeout(async () => {
        // Esconder loading
        if (loadingScreen) loadingScreen.classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        
        if (window.firebase && window.firebase.authFunctions) {
            window.firebase.authFunctions.onAuthStateChanged(window.firebase.auth, (user) => {
                if (user) {
                    currentUser = user;
                    currentUserId = user.uid;
                    showMainApp();
                    loadUserData();
                } else {
                    // Redirecionar para o index (tela de login)
                    window.location.href = 'index.html';
                }
            });
        } else {
            console.error('Firebase não inicializado');
            showToast('Erro: Firebase não carregado. Verifique sua conexão.', 'error');
            // Redirecionar para o index se Firebase não carregar
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }, 1500);
}

function showMainApp() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    const themeColor = localStorage.getItem('themeColor') || 'blue';
    setThemeColor(themeColor, false);
    
    const fontSize = localStorage.getItem('fontSize') || '1';
    updateFontSize(fontSize, false);
    
    switchView('home');
}

// Funções Utilitárias
function getDisplayName(user) {
    if (!user) return "Usuário";
    if (user.displayName && user.displayName.trim() !== '') return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return "Usuário";
}

function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.round((now - d) / 1000);
    
    if (diffSeconds < 60) return 'agora';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}min`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d`;
    if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 604800)}sem`;
    return d.toLocaleDateString('pt-BR');
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function createAvatarElement(name, size = 'w-10 h-10', avatarUrl = null) {
    if (avatarUrl && avatarUrl.startsWith('data:')) {
        return `
            <div class="${size} rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <img src="${avatarUrl}" alt="${escapeHTML(name)}" class="w-full h-full object-cover" loading="lazy">
            </div>
        `;
    }
    
    const initials = name ? name.substring(0, 2).toUpperCase() : 'U';
    return `
        <div class="${size} rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            ${initials}
        </div>
    `;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-lg shadow-lg fade-in flex items-center justify-between ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    toast.innerHTML = `
        <span>${escapeHTML(message)}</span>
        <button onclick="this.parentElement.remove()" class="ml-4 text-white hover:opacity-80">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    const container = document.getElementById('toastContainer');
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'toastContainer';
        newContainer.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-md';
        document.body.appendChild(newContainer);
        newContainer.appendChild(toast);
    } else {
        container.appendChild(toast);
    }
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}

// Carregar Dados do Usuário
async function loadUserData() {
    if (!currentUserId) return;
    
    try {
        const userRef = window.firebase.dbFunctions.ref(window.firebase.database, `users/${currentUserId}`);
        const snapshot = await window.firebase.dbFunctions.get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            userData.uid = currentUserId;
            currentUserProfileData = userData;
            updateUserUI(userData);
            allUsersCache[currentUserId] = userData;
        } else {
            const newUserData = {
                uid: currentUserId,
                displayName: getDisplayName(currentUser),
                email: currentUser.email || '',
                bio: '',
                location: '',
                work: '',
                website: '',
                profilePublic: true,
                showOnlineStatus: true,
                allowTags: true,
                notificationsMessages: true,
                notificationsFriends: true,
                notificationsLikes: true,
                notificationsComments: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                lastSeen: Date.now(),
                isOnline: true,
                avatarUrl: null,
                coverUrl: null,
                postCount: 0,
                friendCount: 0,
                likeCount: 0,
                commentCount: 0
            };
            
            await window.firebase.dbFunctions.set(
                window.firebase.dbFunctions.ref(window.firebase.database, `users/${currentUserId}`),
                newUserData
            );
            
            currentUserProfileData = newUserData;
            updateUserUI(newUserData);
            allUsersCache[currentUserId] = newUserData;
        }
        
        loadStories();
        loadPosts();
        loadNotifications();
        loadTrends();
        updateUserStats();
        setupRealTimeListeners();
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Erro ao carregar dados do usuário', 'error');
    }
}

function updateUserUI(userData) {
    const displayName = getDisplayName(userData);
    const email = userData.email || '';
    
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserEmail = document.getElementById('sidebarUserEmail');
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    
    if (sidebarUserName) sidebarUserName.textContent = displayName;
    if (sidebarUserEmail) sidebarUserEmail.textContent = email;
    if (sidebarUserAvatar) sidebarUserAvatar.innerHTML = createAvatarElement(displayName, 'w-10 h-10', userData.avatarUrl);
    
    const userAvatar = document.getElementById('userAvatar');
    const modalUserName = document.getElementById('modalUserName');
    const modalUserAvatar = document.getElementById('modalUserAvatar');
    
    if (userAvatar) userAvatar.innerHTML = createAvatarElement(displayName, 'w-10 h-10', userData.avatarUrl);
    if (modalUserName) modalUserName.textContent = displayName;
    if (modalUserAvatar) modalUserAvatar.innerHTML = createAvatarElement(displayName, 'w-10 h-10', userData.avatarUrl);
    
    const sidebarDisplayName = document.getElementById('sidebarDisplayName');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    
    if (sidebarDisplayName) sidebarDisplayName.textContent = displayName;
    if (sidebarAvatar) sidebarAvatar.innerHTML = createAvatarElement(displayName, 'w-12 h-12', userData.avatarUrl);
    
    const profileDisplayName = document.getElementById('profileDisplayName');
    const profileEmail = document.getElementById('profileEmail');
    const profileBio = document.getElementById('profileBio');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileLocation = document.getElementById('profileLocation');
    const profileWork = document.getElementById('profileWork');
    const profileWebsite = document.getElementById('profileWebsite');
    const profileJoinDate = document.getElementById('profileJoinDate');
    
    if (profileDisplayName) profileDisplayName.textContent = displayName;
    if (profileEmail) profileEmail.textContent = email;
    if (profileBio) profileBio.textContent = userData.bio || '';
    if (profileAvatar) profileAvatar.innerHTML = createAvatarElement(displayName, 'w-32 h-32', userData.avatarUrl);
    if (profileLocation) profileLocation.textContent = userData.location || 'Não informado';
    if (profileWork) profileWork.textContent = userData.work || 'Não informado';
    if (profileWebsite) profileWebsite.textContent = userData.website || '-';
    
    if (userData.createdAt && profileJoinDate) {
        const joinDate = new Date(userData.createdAt).toLocaleDateString('pt-BR');
        profileJoinDate.textContent = joinDate;
    }
    
    const coverElement = document.querySelector('#profile-section .h-48');
    if (coverElement) {
        if (userData.coverUrl && userData.coverUrl.startsWith('data:')) {
            coverElement.style.backgroundImage = `url('${userData.coverUrl}')`;
            coverElement.style.backgroundSize = 'cover';
            coverElement.style.backgroundPosition = 'center';
            coverElement.classList.remove('bg-gradient-to-r', 'from-blue-500', 'via-purple-600', 'to-pink-500');
        } else {
            coverElement.style.backgroundImage = '';
            coverElement.classList.add('bg-gradient-to-r', 'from-blue-500', 'via-purple-600', 'to-pink-500');
        }
    }
    
    const settingsDisplayName = document.getElementById('settingsDisplayName');
    const settingsEmail = document.getElementById('settingsEmail');
    const settingsBio = document.getElementById('settingsBio');
    const privacyPublicProfile = document.getElementById('privacyPublicProfile');
    const privacyShowOnline = document.getElementById('privacyShowOnline');
    const privacyAllowTags = document.getElementById('privacyAllowTags');
    const notificationsMessages = document.getElementById('notificationsMessages');
    const notificationsFriends = document.getElementById('notificationsFriends');
    const notificationsLikes = document.getElementById('notificationsLikes');
    const notificationsComments = document.getElementById('notificationsComments');
    
    if (settingsDisplayName) settingsDisplayName.value = displayName;
    if (settingsEmail) settingsEmail.value = email;
    if (settingsBio) settingsBio.value = userData.bio || '';
    if (privacyPublicProfile) privacyPublicProfile.checked = userData.profilePublic !== false;
    if (privacyShowOnline) privacyShowOnline.checked = userData.showOnlineStatus !== false;
    if (privacyAllowTags) privacyAllowTags.checked = userData.allowTags !== false;
    if (notificationsMessages) notificationsMessages.checked = userData.notificationsMessages !== false;
    if (notificationsFriends) notificationsFriends.checked = userData.notificationsFriends !== false;
    if (notificationsLikes) notificationsLikes.checked = userData.notificationsLikes !== false;
    if (notificationsComments) notificationsComments.checked = userData.notificationsComments !== false;
    
    const settingsAvatarPreview = document.getElementById('settingsAvatarPreview');
    if (settingsAvatarPreview) {
        if (userData.avatarUrl && userData.avatarUrl.startsWith('data:')) {
            settingsAvatarPreview.innerHTML = `
                <img src="${userData.avatarUrl}" alt="${displayName}" class="w-full h-full object-cover rounded-full" loading="lazy">
                <div class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <i class="fas fa-camera text-white"></i>
                </div>
            `;
        } else {
            settingsAvatarPreview.innerHTML = `
                <i class="fas fa-user"></i>
                <div class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <i class="fas fa-camera text-white"></i>
                </div>
            `;
        }
    }
    
    updateProfileActionButtons();
}

function switchView(view) {
    const sections = ['home', 'notifications', 'settings', 'profile'];
    sections.forEach(section => {
        const element = document.getElementById(`${section}-section`);
        if (element) element.classList.add('hidden');
    });
    
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeSection = document.getElementById(`${view}-section`);
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }
    
    const activeBtn = document.getElementById(`btn${view.charAt(0).toUpperCase() + view.slice(1)}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    switch(view) {
        case 'home':
            loadStories();
            loadPosts();
            break;
        case 'notifications':
            loadNotifications();
            break;
        case 'settings':
            loadUserSettings();
            break;
        case 'profile':
            loadUserProfile(currentUserId);
            break;
    }
    
    const mainContent = document.querySelector('main');
    if (mainContent) mainContent.scrollTop = 0;
}

function goToUserProfile(userId) {
    if (!userId) return;
    if (userId === currentUserId) {
        switchView('profile');
    } else {
        window.location.href = `perfildetalhes.html?uid=${userId}`;
    }
}

// ===== SISTEMA DE POSTS =====
async function loadPosts(forUserId = null) {
    const postsContainer = forUserId ?
        document.getElementById('profilePostsTab') :
        document.getElementById('posts-container');

    if (!postsContainer) return;

    postsContainer.innerHTML = `
        <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    `;

    try {
        const postsRef = window.firebase.dbFunctions.ref(window.firebase.database, 'posts');
        const snapshot = await window.firebase.dbFunctions.get(postsRef);

        postsContainer.innerHTML = '';

        if (!snapshot.exists()) {
            postsContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-newspaper text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">Nenhum post encontrado.</p>
                    ${!forUserId ? '<p class="text-gray-400 text-sm mt-2">Seja o primeiro a postar!</p>' : ''}
                </div>
            `;
            return;
        }

        const posts = [];
        snapshot.forEach(child => {
            const post = { id: child.key, ...child.val() };
            if (!forUserId || post.uid === forUserId) {
                posts.unshift(post);
            }
        });

        posts.sort((a, b) => b.createdAt - a.createdAt);

        for (const post of posts) {
            if (!allUsersCache[post.uid]) {
                try {
                    const userSnap = await window.firebase.dbFunctions.get(
                        window.firebase.dbFunctions.ref(window.firebase.database, `users/${post.uid}`)
                    );
                    if (userSnap.exists()) {
                        allUsersCache[post.uid] = userSnap.val();
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            }
        }

        posts.forEach(post => {
            renderPost(post, postsContainer);
        });

    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = `
            <div class="text-center py-12 text-red-500">
                <i class="fas fa-exclamation-triangle text-3xl mb-4"></i>
                <p>Erro ao carregar posts: ${error.message}</p>
            </div>
        `;
    }
}

function renderPost(post, container) {
    const userData = allUsersCache[post.uid] || { 
        displayName: post.displayName || 'Usuário', 
        email: '', 
        avatarUrl: null 
    };
    
    const reactionCounts = {};
    Object.values(post.reactions || {}).forEach(emoji => {
        reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
    });
    
    const userReaction = post.reactions ? post.reactions[currentUserId] : null;
    const commentsCount = post.comments ? Object.keys(post.comments).length : 0;
    const likesCount = post.likes ? Object.keys(post.likes).length : 0;
    
    // Reações em fila horizontal
    let reactionSummary = '';
    const sortedReactions = Object.entries(reactionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sortedReactions.length > 0) {
        reactionSummary = `<div class="reaction-bar">`;
        sortedReactions.forEach(([emoji, count]) => {
            reactionSummary += `
                <span class="reaction-item" title="${count} reações">
                    <span class="emoji">${emoji}</span>
                    <span class="count">${count}</span>
                </span>
            `;
        });
        reactionSummary += `</div>`;
    }
    
    let taggedPeopleHTML = '';
    if (post.taggedPeople && post.taggedPeople.length > 0) {
        taggedPeopleHTML = `
            <div class="flex items-center text-sm text-gray-500 mt-1">
                <i class="fas fa-tag mr-1"></i>
                <span>Com </span>
                ${post.taggedPeople.slice(0, 3).map(tag => `
                    <span class="font-medium text-blue-600 ml-1">${escapeHTML(tag.name)}</span>
                `).join(', ')}
                ${post.taggedPeople.length > 3 ? `<span> e mais ${post.taggedPeople.length - 3}</span>` : ''}
            </div>
        `;
    }
    
    let feelingHTML = '';
    if (post.feeling) {
        feelingHTML = `
            <div class="flex items-center text-sm text-gray-500 mt-1">
                <span class="text-lg mr-1">${post.feeling.emoji}</span>
                <span>Sentindo-se ${escapeHTML(post.feeling.label)}</span>
            </div>
        `;
    }
    
    let locationHTML = '';
    if (post.location) {
        locationHTML = `
            <div class="flex items-center text-sm text-gray-500 mt-1">
                <i class="fas fa-map-marker-alt mr-1"></i>
                <span>${escapeHTML(post.location)}</span>
            </div>
        `;
    }
    
    const postElement = document.createElement('div');
    postElement.className = 'bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-200 fade-in post-container';
    postElement.dataset.id = post.id;
    
    postElement.innerHTML = `
        <div class="flex items-center space-x-3 mb-4">
            ${createAvatarElement(userData.displayName, 'w-12 h-12', userData.avatarUrl)}
            <div class="flex-1">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="font-bold text-gray-800 cursor-pointer hover:text-blue-600 user-link" onclick="goToUserProfile('${post.uid}')">
                            ${escapeHTML(userData.displayName)}
                        </p>
                        <p class="text-sm text-gray-500">${formatDate(post.createdAt)} • 
                            ${post.privacy === 'public' ? '🌐 Público' : 
                              post.privacy === 'friends' ? '👥 Amigos' : 
                              '🔒 Privado'}
                        </p>
                        ${feelingHTML}
                        ${taggedPeopleHTML}
                        ${locationHTML}
                    </div>
                    <div class="relative">
                        <button onclick="togglePostMenu('${post.id}')" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-ellipsis-h w-5 h-5"></i>
                        </button>
                        <div id="post-menu-${post.id}" class="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden z-10">
                            ${post.uid === currentUserId ? `
                                <button onclick="editPost('${post.id}')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-edit mr-2"></i> Editar
                                </button>
                                <button onclick="deletePost('${post.id}')" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                    <i class="fas fa-trash-alt mr-2"></i> Excluir
                                </button>
                            ` : `
                                <button onclick="reportPost('${post.id}')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-flag mr-2"></i> Denunciar
                                </button>
                                <button onclick="hidePost('${post.id}')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-eye-slash mr-2"></i> Ocultar
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <p class="text-gray-800 mb-4 whitespace-pre-wrap">${escapeHTML(post.text || '')}</p>
        
        ${post.media && post.media.length > 0 ? `
            <div class="mb-4 rounded-lg overflow-hidden">
                ${renderPostMedia(post.media)}
            </div>
        ` : ''}
        
        <div class="flex items-center justify-between text-sm text-gray-500 border-t border-b border-gray-100 py-3 mb-4">
            <div class="flex items-center space-x-4">
                ${reactionSummary || `<span class="text-gray-400 text-xs">Seja o primeiro a reagir</span>`}
            </div>
            <div class="flex items-center space-x-3">
                <span>${likesCount} curtida${likesCount !== 1 ? 's' : ''}</span>
                <span>${commentsCount} comentário${commentsCount !== 1 ? 's' : ''}</span>
                <span>${post.shares || 0} compartilhamento${(post.shares || 0) !== 1 ? 's' : ''}</span>
            </div>
        </div>
        
        <div class="flex justify-between">
            <div class="relative">
                <button onclick="toggleReactionPalette('${post.id}')" class="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all ${userReaction ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}">
                    <i class="fas fa-${userReaction ? 'heart' : 'thumbs-up'} w-5 h-5"></i>
                    <span>${userReaction ? 'Curtido' : 'Curtir'}</span>
                </button>
                <div id="reaction-palette-${post.id}" class="reaction-palette hidden">
                    ${Object.entries(REACTIONS).map(([emoji, config]) => `
                        <button onclick="reactToPost('${post.id}', '${emoji}')" class="emoji-btn" title="${config.label}">
                            ${emoji}
                        </button>
                    `).join('')}
                </div>
            </div>
            <button onclick="toggleComments('${post.id}')" class="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-green-600 hover:bg-gray-100 transition-all">
                <i class="fas fa-comment w-5 h-5"></i>
                <span>Comentar</span>
            </button>
            <button onclick="sharePost('${post.id}')" class="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-gray-100 transition-all">
                <i class="fas fa-share-alt w-5 h-5"></i>
                <span>Compartilhar</span>
            </button>
        </div>
        
        <div id="comments-${post.id}" class="mt-4 hidden">
            <div class="space-y-3 mb-4" id="comments-list-${post.id}"></div>
            <div class="flex space-x-2">
                ${createAvatarElement(getDisplayName(currentUser), 'w-8 h-8', allUsersCache[currentUserId]?.avatarUrl)}
                <input type="text" 
                       id="comment-input-${post.id}" 
                       placeholder="Adicione um comentário..." 
                       class="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                       onkeypress="if(event.key === 'Enter') addComment('${post.id}')">
                <button onclick="addComment('${post.id}')" class="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-all">
                    <i class="fas fa-paper-plane w-5 h-5"></i>
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(postElement);
}

function renderPostMedia(mediaArray) {
    if (mediaArray.length === 1) {
        const media = mediaArray[0];
        if (media.type === 'photo') {
            return `<img src="${media.url}" alt="Imagem do post" class="w-full h-auto max-h-96 object-cover rounded-lg" loading="lazy" onerror="this.style.display='none'">`;
        } else if (media.type === 'video') {
            return `<video src="${media.url}" controls class="w-full h-auto max-h-96 rounded-lg" onerror="this.style.display='none'"></video>`;
        }
    } else if (mediaArray.length === 2) {
        return `
            <div class="grid grid-cols-2 gap-1">
                ${mediaArray.map(media => `
                    ${media.type === 'photo' ? 
                        `<img src="${media.url}" alt="Imagem do post" class="w-full h-48 object-cover" loading="lazy" onerror="this.style.display='none'">` :
                        `<video src="${media.url}" controls class="w-full h-48 object-cover" onerror="this.style.display='none'"></video>`
                    }
                `).join('')}
            </div>
        `;
    } else if (mediaArray.length === 3) {
        return `
            <div class="grid grid-cols-2 gap-1">
                <div class="row-span-2">
                    ${mediaArray[0].type === 'photo' ? 
                        `<img src="${mediaArray[0].url}" alt="Imagem do post" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'">` :
                        `<video src="${mediaArray[0].url}" controls class="w-full h-full object-cover" onerror="this.style.display='none'"></video>`
                    }
                </div>
                <div>
                    ${mediaArray[1].type === 'photo' ? 
                        `<img src="${mediaArray[1].url}" alt="Imagem do post" class="w-full h-48 object-cover" loading="lazy" onerror="this.style.display='none'">` :
                        `<video src="${mediaArray[1].url}" controls class="w-full h-48 object-cover" onerror="this.style.display='none'"></video>`
                    }
                </div>
                <div>
                    ${mediaArray[2].type === 'photo' ? 
                        `<img src="${mediaArray[2].url}" alt="Imagem do post" class="w-full h-48 object-cover" loading="lazy" onerror="this.style.display='none'">` :
                        `<video src="${mediaArray[2].url}" controls class="w-full h-48 object-cover" onerror="this.style.display='none'"></video>`
                    }
                </div>
            </div>
        `;
    } else {
        return `
            <div class="grid grid-cols-2 gap-1">
                ${mediaArray.slice(0, 4).map((media, index) => `
                    <div class="relative ${index === 3 && mediaArray.length > 4 ? 'bg-gray-800' : ''}">
                        ${media.type === 'photo' ? 
                            `<img src="${media.url}" alt="Imagem do post" class="w-full h-48 object-cover" loading="lazy" onerror="this.style.display='none'">` :
                            `<video src="${media.url}" controls class="w-full h-48 object-cover" onerror="this.style.display='none'"></video>`
                        }
                        ${index === 3 && mediaArray.length > 4 ? `
                            <div class="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                <span class="text-white text-2xl font-bold">+${mediaArray.length - 4}</span>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
}

async function publishPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content && currentMedia.length === 0) {
        showToast('Digite algo ou adicione uma mídia para publicar!', 'error');
        return;
    }
    
    try {
        const mediaWithBase64 = [];
        for (const media of currentMedia) {
            if (media.url && media.url.startsWith('data:')) {
                mediaWithBase64.push({
                    type: media.type,
                    url: media.url,
                    filename: media.file ? media.file.name : 'media'
                });
            }
        }
        
        const postData = {
            uid: currentUserId,
            displayName: getDisplayName(currentUser),
            text: content,
            media: mediaWithBase64.length > 0 ? mediaWithBase64 : null,
            privacy: document.getElementById('postPrivacy')?.value || 'public',
            feeling: currentFeeling,
            taggedPeople: taggedPeople.length > 0 ? taggedPeople : null,
            location: currentLocation,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            reactions: {},
            likes: {},
            comments: {},
            shares: 0
        };
        
        if (currentEditingPostId) {
            await window.firebase.dbFunctions.update(
                window.firebase.dbFunctions.ref(window.firebase.database, `posts/${currentEditingPostId}`), 
                postData
            );
            showToast('Post atualizado com sucesso!', 'success');
            currentEditingPostId = null;
        } else {
            await window.firebase.dbFunctions.push(
                window.firebase.dbFunctions.ref(window.firebase.database, 'posts'), 
                postData
            );
            showToast('Post publicado com sucesso!', 'success');
            await updateUserPostCount(currentUserId, 1);
        }
        
        closePostModal();
        resetPostForm();
        
        if (document.getElementById('profile-section').classList.contains('hidden')) {
            loadPosts();
        } else {
            loadUserProfile(currentUserId);
        }
        
    } catch (error) {
        console.error('Error publishing post:', error);
        showToast('Erro ao publicar post. Tente novamente.', 'error');
    }
}

async function updateUserPostCount(userId, increment = 1) {
    try {
        const userRef = window.firebase.dbFunctions.ref(window.firebase.database, `users/${userId}`);
        const snapshot = await window.firebase.dbFunctions.get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const currentCount = userData.postCount || 0;
            
            await window.firebase.dbFunctions.update(userRef, {
                postCount: currentCount + increment,
                updatedAt: Date.now()
            });
            
            if (allUsersCache[userId]) {
                allUsersCache[userId].postCount = currentCount + increment;
            }
            
            if (userId === currentUserId) {
                currentUserProfileData.postCount = currentCount + increment;
                updateUserStats();
            }
        }
    } catch (error) {
        console.error('Error updating post count:', error);
    }
}

function updateUserStats() {
    if (!currentUserProfileData) return;
    
    const profilePostCount = document.getElementById('profilePostCount');
    const profileFriendCount = document.getElementById('profileFriendCount');
    const profileLikesCount = document.getElementById('profileLikesCount');
    const profileCommentsCount = document.getElementById('profileCommentsCount');
    
    if (profilePostCount) profilePostCount.textContent = currentUserProfileData.postCount || 0;
    if (profileFriendCount) profileFriendCount.textContent = currentUserProfileData.friendCount || 0;
    if (profileLikesCount) profileLikesCount.textContent = currentUserProfileData.likeCount || 0;
    if (profileCommentsCount) profileCommentsCount.textContent = currentUserProfileData.commentCount || 0;
    
    const sidebarFriendsCount = document.getElementById('sidebarFriendsCount');
    const sidebarPostsCount = document.getElementById('sidebarPostsCount');
    
    if (sidebarFriendsCount) sidebarFriendsCount.textContent = currentUserProfileData.friendCount || 0;
    if (sidebarPostsCount) sidebarPostsCount.textContent = currentUserProfileData.postCount || 0;
    
    const notificationsCount = currentUserProfileData.notificationsCount || 0;
    const sidebarNotificationsCount = document.getElementById('sidebarNotificationsCount');
    if (sidebarNotificationsCount) {
        sidebarNotificationsCount.textContent = notificationsCount;
        sidebarNotificationsCount.style.display = notificationsCount > 0 ? 'flex' : 'none';
    }
}

function updateProfileActionButtons() {
    const container = document.getElementById('profileActionButtons');
    if (!container) return;
    
    container.innerHTML = `
        <button onclick="editProfile()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-all">
            <i class="fas fa-edit mr-2"></i> Editar Perfil
        </button>
        <button onclick="logout()" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-all">
            <i class="fas fa-sign-out-alt mr-2"></i> Sair
        </button>
    `;
}

function resetPostForm() {
    currentMedia = [];
    currentFeeling = null;
    taggedPeople = [];
    currentLocation = null;
    currentEditingPostId = null;
    
    const postContent = document.getElementById('postContent');
    const modalCharCount = document.getElementById('modalCharCount');
    const modalMediaPreview = document.getElementById('modalMediaPreview');
    const postFeelingSection = document.getElementById('postFeelingSection');
    const postTagsSection = document.getElementById('postTagsSection');
    const postLocationSection = document.getElementById('postLocationSection');
    
    if (postContent) postContent.value = '';
    if (modalCharCount) modalCharCount.textContent = '5000';
    if (modalMediaPreview) modalMediaPreview.innerHTML = '';
    if (postFeelingSection) postFeelingSection.classList.add('hidden');
    if (postTagsSection) postTagsSection.classList.add('hidden');
    if (postLocationSection) postLocationSection.classList.add('hidden');
    
    const publishBtn = document.querySelector('#postModal button[onclick="publishPost()"]');
    if (publishBtn) {
        publishBtn.textContent = 'Publicar';
        publishBtn.onclick = () => publishPost();
    }
}

function openPostModal() {
    if (!currentUserId) {
        showToast('Faça login para criar posts', 'error');
        return;
    }
    
    const postModal = document.getElementById('postModal');
    if (postModal) {
        postModal.classList.remove('hidden');
        postModal.classList.add('flex');
    }
    
    const postContent = document.getElementById('postContent');
    if (postContent) postContent.focus();
}

function closePostModal() {
    const postModal = document.getElementById('postModal');
    if (postModal) {
        postModal.classList.add('hidden');
        postModal.classList.remove('flex');
    }
    resetPostForm();
}

function updateCharCount() {
    const textarea = document.getElementById('postContent');
    const charCount = document.getElementById('modalCharCount');
    
    if (!textarea || !charCount) return;
    
    const remaining = 5000 - textarea.value.length;
    charCount.textContent = remaining;
    
    if (remaining < 100) {
        charCount.classList.add('text-red-500');
    } else if (remaining < 500) {
        charCount.classList.remove('text-red-500');
        charCount.classList.add('text-yellow-500');
    } else {
        charCount.classList.remove('text-red-500', 'text-yellow-500');
    }
}

function handleMediaSelection(type) {
    if (type === 'photo' || type === 'video') {
        const mediaFileInput = document.getElementById('mediaFileInput');
        if (mediaFileInput) mediaFileInput.click();
    } else if (type === 'feeling') {
        openFeelingPicker();
    } else if (type === 'tag') {
        openTagPeople();
    } else if (type === 'location') {
        openLocationPicker();
    }
}

function handleModalMediaSelection(type) {
    if (type === 'photo') {
        const mediaFileInput = document.getElementById('mediaFileInput');
        if (mediaFileInput) mediaFileInput.click();
    }
}

function handleMediaFileUpload(event) {
    const files = Array.from(event.target.files);
    const previewContainer = document.getElementById('modalMediaPreview');
    
    if (!previewContainer) return;
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');
            
            if (!isVideo && !isImage) {
                showToast('Formato de arquivo não suportado', 'error');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showToast('Arquivo muito grande. Tamanho máximo: 5MB', 'error');
                return;
            }
            
            const mediaItem = {
                type: isVideo ? 'video' : 'photo',
                file: file,
                url: e.target.result,
                thumbnail: isVideo ? null : e.target.result
            };
            
            currentMedia.push(mediaItem);
            renderMediaPreview();
        };
        
        reader.readAsDataURL(file);
    });
    
    event.target.value = '';
}

function renderMediaPreview() {
    const previewContainer = document.getElementById('modalMediaPreview');
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';
    
    if (currentMedia.length === 0) {
        previewContainer.classList.add('hidden');
        return;
    }
    
    previewContainer.classList.remove('hidden');
    previewContainer.innerHTML = '<div class="grid grid-cols-2 gap-2">';
    
    currentMedia.forEach((media, index) => {
        previewContainer.innerHTML += `
            <div class="relative rounded-lg overflow-hidden">
                ${media.type === 'photo' ? 
                    `<img src="${media.url}" alt="Preview" class="w-full h-32 object-cover" loading="lazy">` :
                    `<video src="${media.url}" class="w-full h-32 object-cover" controls></video>`
                }
                <button onclick="removeMedia(${index})" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
        `;
    });
    
    previewContainer.innerHTML += '</div>';
}

function removeMedia(index) {
    currentMedia.splice(index, 1);
    renderMediaPreview();
}

function addEmoji() {
    const textarea = document.getElementById('postContent');
    if (!textarea) return;
    
    const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '👏', '🙏', '😎', '🤩'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);
    const textAfter = textarea.value.substring(cursorPos);
    
    textarea.value = textBefore + randomEmoji + textAfter;
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = cursorPos + randomEmoji.length;
    updateCharCount();
}

function openFeelingPicker() {
    const modal = document.getElementById('feelingPickerModal');
    const container = modal.querySelector('.grid');
    
    if (!modal || !container) return;
    
    container.innerHTML = FEELINGS.map(feeling => `
        <button onclick="selectFeeling('${feeling.emoji}', '${feeling.label}')" class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 transition-all">
            <span class="text-2xl mb-1">${feeling.emoji}</span>
            <span class="text-xs text-gray-600">${feeling.label}</span>
        </button>
    `).join('');
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeFeelingPickerModal() {
    const modal = document.getElementById('feelingPickerModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function selectFeeling(emoji, label) {
    currentFeeling = { emoji, label };
    
    const feelingSection = document.getElementById('postFeelingSection');
    const feelingTags = document.getElementById('feelingTags');
    
    if (feelingSection && feelingTags) {
        feelingSection.classList.remove('hidden');
        feelingTags.innerHTML = `
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                <span class="mr-2">${emoji}</span>
                <span>${label}</span>
            </span>
        `;
    }
    
    closeFeelingPickerModal();
}

function clearFeeling() {
    currentFeeling = null;
    const feelingSection = document.getElementById('postFeelingSection');
    if (feelingSection) {
        feelingSection.classList.add('hidden');
    }
}

function openTagPeople() {
    const modal = document.getElementById('tagPeopleModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        loadFriendsForTag();
    }
}

function closeTagPeopleModal() {
    const modal = document.getElementById('tagPeopleModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function loadFriendsForTag() {
    const container = document.getElementById('tagFriendsList');
    const selectedContainer = document.getElementById('selectedPeopleTags');
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    `;
    
    if (selectedContainer) {
        selectedContainer.innerHTML = taggedPeople.map(person => `
            <span class="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                ${escapeHTML(person.name)}
                <button onclick="removeTaggedPerson('${person.uid}')" class="ml-1 text-blue-600 hover:text-blue-800">
                    <i class="fas fa-times w-3 h-3"></i>
                </button>
            </span>
        `).join('');
    }
    
    try {
        const friendsRef = window.firebase.dbFunctions.ref(window.firebase.database, `friends/${currentUserId}`);
        const snapshot = await window.firebase.dbFunctions.get(friendsRef);
        
        container.innerHTML = '';
        
        if (!snapshot.exists()) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <p>Você ainda não tem amigos para marcar</p>
                </div>
            `;
            return;
        }
        
        const friendUids = Object.keys(snapshot.val());
        const friends = [];
        
        for (const friendUid of friendUids) {
            let userData = allUsersCache[friendUid];
            if (!userData) {
                try {
                    const userSnap = await window.firebase.dbFunctions.get(
                        window.firebase.dbFunctions.ref(window.firebase.database, `users/${friendUid}`)
                    );
                    if (userSnap.exists()) {
                        userData = userSnap.val();
                        allUsersCache[friendUid] = userData;
                    } else {
                        continue;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            friends.push({
                uid: friendUid,
                name: userData.displayName,
                email: userData.email,
                avatarUrl: userData.avatarUrl
            });
        }
        
        friends.forEach(friend => {
            const isSelected = taggedPeople.some(p => p.uid === friend.uid);
            
            const friendElement = document.createElement('div');
            friendElement.className = `flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`;
            friendElement.onclick = () => toggleTaggedPerson(friend);
            
            friendElement.innerHTML = `
                <div class="flex-shrink-0">
                    ${createAvatarElement(friend.name, 'w-8 h-8', friend.avatarUrl)}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-800 truncate">${escapeHTML(friend.name)}</p>
                    <p class="text-xs text-gray-500 truncate">${escapeHTML(friend.email || '')}</p>
                </div>
                ${isSelected ? `
                    <div class="text-blue-600">
                        <i class="fas fa-check"></i>
                    </div>
                ` : ''}
            `;
            
            container.appendChild(friendElement);
        });
        
    } catch (error) {
        console.error('Error loading friends for tag:', error);
        container.innerHTML = `
            <div class="text-center py-4 text-red-500">
                <p>Erro ao carregar amigos</p>
            </div>
        `;
    }
}

function toggleTaggedPerson(person) {
    const index = taggedPeople.findIndex(p => p.uid === person.uid);
    
    if (index === -1) {
        taggedPeople.push(person);
    } else {
        taggedPeople.splice(index, 1);
    }
    
    loadFriendsForTag();
}

function removeTaggedPerson(uid) {
    taggedPeople = taggedPeople.filter(p => p.uid !== uid);
    loadFriendsForTag();
}

function searchFriendsForTag() {
    const query = document.getElementById('tagSearchInput').value.toLowerCase();
    const friendElements = document.querySelectorAll('#tagFriendsList > div');
    
    friendElements.forEach(element => {
        const name = element.querySelector('.font-medium').textContent.toLowerCase();
        const email = element.querySelector('.text-xs').textContent.toLowerCase();
        
        if (name.includes(query) || email.includes(query)) {
            element.style.display = 'flex';
        } else {
            element.style.display = 'none';
        }
    });
}

function saveTags() {
    const tagsSection = document.getElementById('postTagsSection');
    const tagsContainer = document.getElementById('taggedPeople');
    
    if (taggedPeople.length === 0) {
        if (tagsSection) tagsSection.classList.add('hidden');
        closeTagPeopleModal();
        return;
    }
    
    if (tagsSection && tagsContainer) {
        tagsSection.classList.remove('hidden');
        tagsContainer.innerHTML = taggedPeople.map(person => `
            <span class="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                ${escapeHTML(person.name)}
            </span>
        `).join('');
    }
    
    closeTagPeopleModal();
}

function clearTags() {
    taggedPeople = [];
    const tagsSection = document.getElementById('postTagsSection');
    if (tagsSection) {
        tagsSection.classList.add('hidden');
    }
}

function openLocationPicker() {
    const mockLocations = [
        "São Paulo, Brasil",
        "Rio de Janeiro, Brasil",
        "Belo Horizonte, Brasil",
        "Curitiba, Brasil",
        "Porto Alegre, Brasil",
        "Salvador, Brasil",
        "Fortaleza, Brasil",
        "Recife, Brasil",
        "Brasília, Brasil",
        "Campinas, Brasil"
    ];
    
    const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    currentLocation = randomLocation;
    
    const locationSection = document.getElementById('postLocationSection');
    const locationText = document.getElementById('postLocationText');
    
    if (locationSection && locationText) {
        locationSection.classList.remove('hidden');
        locationText.textContent = currentLocation;
    }
}

function clearLocation() {
    currentLocation = null;
    const locationSection = document.getElementById('postLocationSection');
    if (locationSection) {
        locationSection.classList.add('hidden');
    }
}

async function reactToPost(postId, emoji) {
    try {
        const reactionRef = window.firebase.dbFunctions.ref(
            window.firebase.database, 
            `posts/${postId}/reactions/${currentUserId}`
        );
        
        const existingReaction = await window.firebase.dbFunctions.get(reactionRef);
        
        if (existingReaction.exists() && existingReaction.val() === emoji) {
            await window.firebase.dbFunctions.remove(reactionRef);
        } else {
            await window.firebase.dbFunctions.set(reactionRef, emoji);
        }
        
        const palette = document.getElementById(`reaction-palette-${postId}`);
        if (palette) palette.classList.add('hidden');
        
        // Recarregar o post para atualizar a exibição
        loadPosts();
        
    } catch (error) {
        console.error('Error reacting to post:', error);
        showToast('Erro ao reagir ao post.', 'error');
    }
}

function toggleReactionPalette(postId) {
    const palette = document.getElementById(`reaction-palette-${postId}`);
    if (!palette) return;
    
    const isVisible = !palette.classList.contains('hidden');
    
    document.querySelectorAll('[id^="reaction-palette-"]').forEach(p => {
        p.classList.add('hidden');
        p.classList.remove('visible');
    });
    
    if (!isVisible) {
        palette.classList.remove('hidden');
        palette.classList.add('visible');
        
        setTimeout(() => {
            const closePalette = (e) => {
                if (!palette.contains(e.target) && !e.target.closest(`[onclick*="toggleReactionPalette('${postId}')"]`)) {
                    palette.classList.add('hidden');
                    palette.classList.remove('visible');
                    document.removeEventListener('click', closePalette);
                }
            };
            document.addEventListener('click', closePalette);
        }, 0);
    }
}

function togglePostMenu(postId) {
    const menu = document.getElementById(`post-menu-${postId}`);
    if (!menu) return;
    
    const isVisible = !menu.classList.contains('hidden');
    
    document.querySelectorAll('[id^="post-menu-"]').forEach(m => {
        m.classList.add('hidden');
    });
    
    if (!isVisible) {
        menu.classList.remove('hidden');
        
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target) && !e.target.closest(`[onclick*="togglePostMenu('${postId}')"]`)) {
                    menu.classList.add('hidden');
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 0);
    }
}

async function editPost(postId) {
    try {
        const postRef = window.firebase.dbFunctions.ref(window.firebase.database, `posts/${postId}`);
        const snapshot = await window.firebase.dbFunctions.get(postRef);
        
        if (!snapshot.exists() || snapshot.val().uid !== currentUserId) {
            showToast('Você não pode editar este post', 'error');
            return;
        }
        
        const post = snapshot.val();
        currentEditingPostId = postId;
        
        openPostModal();
        
        const postContent = document.getElementById('postContent');
        if (postContent) {
            postContent.value = post.text || '';
            updateCharCount();
        }
        
        const postPrivacy = document.getElementById('postPrivacy');
        if (postPrivacy) {
            postPrivacy.value = post.privacy || 'public';
        }
        
        if (post.feeling) {
            currentFeeling = post.feeling;
            const feelingSection = document.getElementById('postFeelingSection');
            const feelingTags = document.getElementById('feelingTags');
            
            if (feelingSection && feelingTags) {
                feelingSection.classList.remove('hidden');
                feelingTags.innerHTML = `
                    <span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                        <span class="mr-2">${post.feeling.emoji}</span>
                        <span>${post.feeling.label}</span>
                    </span>
                `;
            }
        }
        
        if (post.taggedPeople && post.taggedPeople.length > 0) {
            taggedPeople = post.taggedPeople;
            const tagsSection = document.getElementById('postTagsSection');
            const tagsContainer = document.getElementById('taggedPeople');
            
            if (tagsSection && tagsContainer) {
                tagsSection.classList.remove('hidden');
                tagsContainer.innerHTML = taggedPeople.map(person => `
                    <span class="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                        ${escapeHTML(person.name)}
                    </span>
                `).join('');
            }
        }
        
        if (post.location) {
            currentLocation = post.location;
            const locationSection = document.getElementById('postLocationSection');
            const locationText = document.getElementById('postLocationText');
            
            if (locationSection && locationText) {
                locationSection.classList.remove('hidden');
                locationText.textContent = post.location;
            }
        }
        
        if (post.media && post.media.length > 0) {
            currentMedia = post.media;
            renderMediaPreview();
        }
        
        const publishBtn = document.querySelector('#postModal button[onclick="publishPost()"]');
        if (publishBtn) {
            publishBtn.textContent = 'Atualizar';
        }
        
    } catch (error) {
        console.error('Error editing post:', error);
        showToast('Erro ao carregar post para edição', 'error');
    }
}

async function deletePost(postId) {
    if (!confirm('Tem certeza que deseja excluir este post?')) {
        return;
    }
    
    try {
        await window.firebase.dbFunctions.remove(
            window.firebase.dbFunctions.ref(window.firebase.database, `posts/${postId}`)
        );
        
        await updateUserPostCount(currentUserId, -1);
        showToast('Post excluído com sucesso', 'success');
        loadPosts();
    } catch (error) {
        console.error('Error deleting post:', error);
        showToast('Erro ao excluir post', 'error');
    }
}

function reportPost(postId) {
    showToast('Post denunciado. Obrigado pela sua contribuição.', 'success');
}

function hidePost(postId) {
    const postElement = document.querySelector(`[data-id="${postId}"]`);
    if (postElement) {
        postElement.style.display = 'none';
        showToast('Post ocultado', 'info');
    }
}

async function sharePost(postId) {
    try {
        const postRef = window.firebase.dbFunctions.ref(window.firebase.database, `posts/${postId}`);
        const snapshot = await window.firebase.dbFunctions.get(postRef);
        
        if (snapshot.exists()) {
            const post = snapshot.val();
            const shares = (post.shares || 0) + 1;
            
            await window.firebase.dbFunctions.update(postRef, { shares: shares });
            
            const postUrl = `${window.location.origin}?post=${postId}`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(postUrl).then(() => {
                    showToast('Link do post copiado para a área de transferência!', 'success');
                }).catch(() => {
                    showToast('Post compartilhado!', 'success');
                });
            } else {
                showToast('Post compartilhado!', 'success');
            }
        }
    } catch (error) {
        console.error('Error sharing post:', error);
        showToast('Erro ao compartilhar post', 'error');
    }
}

async function loadComments(postId) {
    const container = document.getElementById(`comments-list-${postId}`);
    if (!container) return;
    
    try {
        const commentsRef = window.firebase.dbFunctions.ref(window.firebase.database, `posts/${postId}/comments`);
        const snapshot = await window.firebase.dbFunctions.get(commentsRef);
        
        container.innerHTML = '';
        
        if (!snapshot.exists()) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum comentário ainda.</p>';
            return;
        }
        
        const comments = [];
        snapshot.forEach(child => {
            comments.push({ id: child.key, ...child.val() });
        });
        
        comments.sort((a, b) => b.createdAt - a.createdAt);
        
        comments.forEach(comment => {
            const userData = allUsersCache[comment.uid] || { displayName: comment.displayName || 'Usuário', avatarUrl: null };
            
            const commentHTML = `
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        ${createAvatarElement(userData.displayName, 'w-8 h-8', userData.avatarUrl)}
                    </div>
                    <div class="flex-1">
                        <div class="bg-gray-50 rounded-xl p-3">
                            <p class="font-bold text-sm text-gray-800">${escapeHTML(userData.displayName)}</p>
                            <p class="text-gray-800 mt-1">${escapeHTML(comment.text)}</p>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">${formatDate(comment.createdAt)}</p>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', commentHTML);
        });
    } catch (error) {
        console.error('Error loading comments:', error);
        container.innerHTML = '<p class="text-red-500 text-center py-4">Erro ao carregar comentários.</p>';
    }
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    try {
        const commentData = {
            uid: currentUserId,
            displayName: getDisplayName(currentUser),
            text: text,
            createdAt: Date.now()
        };
        
        await window.firebase.dbFunctions.push(
            window.firebase.dbFunctions.ref(window.firebase.database, `posts/${postId}/comments`), 
            commentData
        );
        
        input.value = '';
        
        const postRef = window.firebase.dbFunctions.ref(window.firebase.database, `posts/${postId}`);
        const postSnap = await window.firebase.dbFunctions.get(postRef);
        
        if (postSnap.exists() && postSnap.val().uid !== currentUserId) {
            await window.firebase.dbFunctions.push(
                window.firebase.dbFunctions.ref(window.firebase.database, `notifications/${postSnap.val().uid}`), 
                {
                    type: 'comment',
                    fromUid: currentUserId,
                    fromName: getDisplayName(currentUser),
                    text: text.length > 50 ? text.substring(0, 50) + '...' : text,
                    postId: postId,
                    createdAt: Date.now(),
                    read: false
                }
            );
        }
        
        loadComments(postId);
        
    } catch (error) {
        console.error('Error adding comment:', error);
        showToast('Erro ao adicionar comentário.', 'error');
    }
}

function toggleComments(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    if (!commentsDiv) return;
    
    const isHidden = commentsDiv.classList.contains('hidden');
    
    if (isHidden) {
        commentsDiv.classList.remove('hidden');
        loadComments(postId);
    } else {
        commentsDiv.classList.add('hidden');
    }
}

// ===== SISTEMA DE STORIES =====
async function loadStories() {
    const container = document.getElementById('stories-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const addStoryHTML = `
        <div onclick="openCreateStoryModal()" class="flex flex-col items-center cursor-pointer flex-shrink-0">
            <div class="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-1 hover:border-blue-500 transition-all">
                <div class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
                    <i class="fas fa-plus"></i>
                </div>
            </div>
            <span class="text-xs text-gray-600">Criar</span>
        </div>
    `;
    container.innerHTML = addStoryHTML;
    
    try {
        const storiesRef = window.firebase.dbFunctions.ref(window.firebase.database, 'stories');
        const snapshot = await window.firebase.dbFunctions.get(storiesRef);
        
        if (!snapshot.exists()) {
            return;
        }
        
        const storiesByUser = {};
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        snapshot.forEach(child => {
            try {
                const story = { id: child.key, ...child.val() };
                if (story.createdAt && story.createdAt > twentyFourHoursAgo) {
                    if (!storiesByUser[story.uid]) {
                        storiesByUser[story.uid] = [];
                    }
                    storiesByUser[story.uid].push(story);
                }
            } catch (err) {
                console.warn('Erro ao processar story:', err);
            }
        });
        
        let friendUids = [];
        try {
            const friendsRef = window.firebase.dbFunctions.ref(window.firebase.database, `friends/${currentUserId}`);
            const friendsSnap = await window.firebase.dbFunctions.get(friendsRef);
            if (friendsSnap.exists()) {
                friendUids = Object.keys(friendsSnap.val());
            }
        } catch (err) {
            console.warn('Erro ao buscar amigos:', err);
        }
        
        const addedUsers = new Set();
        
        if (storiesByUser[currentUserId] && storiesByUser[currentUserId].length > 0) {
            const userData = allUsersCache[currentUserId] || { 
                displayName: getDisplayName(currentUser), 
                avatarUrl: null 
            };
            const hasUnviewed = storiesByUser[currentUserId].some(story => !story.views || !story.views[currentUserId]);
            addedUsers.add(currentUserId);
            
            const storyHTML = `
                <div onclick="viewMyStories()" class="flex flex-col items-center cursor-pointer flex-shrink-0">
                    <div class="story-ring ${hasUnviewed ? '' : 'viewed'} rounded-full p-0.5 mb-1">
                        ${createAvatarElement(userData.displayName, 'w-14 h-14', userData.avatarUrl)}
                    </div>
                    <span class="text-xs text-gray-600 truncate max-w-16">Seu story</span>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', storyHTML);
        }
        
        for (const uid of friendUids) {
            if (storiesByUser[uid] && uid !== currentUserId && !addedUsers.has(uid)) {
                const userData = allUsersCache[uid];
                if (!userData) continue;
                
                addedUsers.add(uid);
                const hasUnviewed = storiesByUser[uid].some(story => !story.views || !story.views[currentUserId]);
                
                const storyHTML = `
                    <div onclick="viewUserStories('${uid}')" class="flex flex-col items-center cursor-pointer flex-shrink-0">
                        <div class="story-ring ${hasUnviewed ? '' : 'viewed'} rounded-full p-0.5 mb-1">
                            ${createAvatarElement(userData.displayName, 'w-14 h-14', userData.avatarUrl)}
                        </div>
                        <span class="text-xs text-gray-600 truncate max-w-16">${escapeHTML(userData.displayName)}</span>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', storyHTML);
            }
        }
        
    } catch (error) {
        console.error('Error loading stories:', error);
    }
}

async function viewUserStories(userId) {
    try {
        const storiesRef = window.firebase.dbFunctions.ref(window.firebase.database, 'stories');
        const snapshot = await window.firebase.dbFunctions.get(storiesRef);
        
        if (!snapshot.exists()) {
            showToast('Nenhum story disponível', 'info');
            return;
        }
        
        activeUserStories = [];
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        snapshot.forEach(child => {
            try {
                const story = { id: child.key, ...child.val() };
                if (story.uid === userId && story.createdAt > twentyFourHoursAgo) {
                    activeUserStories.push(story);
                }
            } catch (err) {
                console.warn('Erro ao processar story:', err);
            }
        });
        
        if (activeUserStories.length === 0) {
            showToast('Nenhum story disponível', 'info');
            return;
        }
        
        activeUserStories.sort((a, b) => a.createdAt - b.createdAt);
        currentStoryIndex = 0;
        openStoryViewer();
        
    } catch (error) {
        console.error('Error loading user stories:', error);
        showToast('Erro ao carregar stories', 'error');
    }
}

function viewMyStories() {
    viewUserStories(currentUserId);
}

function openStoryViewer() {
    if (activeUserStories.length === 0) return;
    
    const modal = document.getElementById('storyViewerModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    
    displayCurrentStory();
    startStoryProgress();
}

function closeStoryViewer() {
    const modal = document.getElementById('storyViewerModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    
    if (storyViewTimeout) {
        clearTimeout(storyViewTimeout);
        storyViewTimeout = null;
    }
    
    activeUserStories = [];
    currentStoryIndex = 0;
}

function displayCurrentStory() {
    if (currentStoryIndex >= activeUserStories.length) {
        closeStoryViewer();
        return;
    }
    
    const story = activeUserStories[currentStoryIndex];
    const userData = allUsersCache[story.uid] || { displayName: story.displayName || 'Usuário', avatarUrl: null };
    
    const storyViewerName = document.getElementById('storyViewerName');
    const storyViewerTime = document.getElementById('storyViewerTime');
    const storyViewerAvatar = document.getElementById('storyViewerAvatar');
    
    if (storyViewerName) storyViewerName.textContent = userData.displayName;
    if (storyViewerTime) storyViewerTime.textContent = formatDate(story.createdAt);
    if (storyViewerAvatar) storyViewerAvatar.innerHTML = createAvatarElement(userData.displayName, 'w-10 h-10', userData.avatarUrl);
    
    updateProgressBars();
    
    const contentDisplay = document.getElementById('storyContentDisplay');
    if (!contentDisplay) return;
    
    if (story.mediaUrl) {
        contentDisplay.innerHTML = `
            <img src="${story.mediaUrl}" alt="Story" class="w-full h-full object-contain bg-black" loading="lazy">
            ${story.text ? `
                <div class="absolute inset-0 flex items-center justify-center p-4">
                    <div class="text-white text-2xl font-bold text-center" style="color: ${story.textColor || '#ffffff'}">
                        ${escapeHTML(story.text)}
                    </div>
                </div>
            ` : ''}
        `;
    } else {
        contentDisplay.innerHTML = `
            <div class="w-full h-full flex items-center justify-center p-4" style="background: ${story.backgroundColor || '#3b82f6'}">
                <div class="text-white text-3xl font-bold text-center" style="color: ${story.textColor || '#ffffff'}">
                    ${escapeHTML(story.text)}
                </div>
            </div>
        `;
    }
    
    markStoryAsViewed(story.id);
}

function updateProgressBars() {
    const container = document.getElementById('storyProgressBars');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < activeUserStories.length; i++) {
        const bar = document.createElement('div');
        bar.className = `h-1 flex-1 rounded-full ${i < currentStoryIndex ? 'bg-white' : 'bg-gray-400'}`;
        
        if (i === currentStoryIndex) {
            const progress = document.createElement('div');
            progress.className = 'h-1 bg-white rounded-full';
            progress.style.width = '0%';
            progress.style.transition = 'width 5s linear';
            bar.appendChild(progress);
            
            setTimeout(() => {
                progress.style.width = '100%';
            }, 100);
        }
        
        container.appendChild(bar);
    }
}

function startStoryProgress() {
    if (storyViewTimeout) {
        clearTimeout(storyViewTimeout);
    }
    
    storyViewTimeout = setTimeout(() => {
        currentStoryIndex++;
        if (currentStoryIndex < activeUserStories.length) {
            displayCurrentStory();
            startStoryProgress();
        } else {
            closeStoryViewer();
        }
    }, 5000);
}

async function markStoryAsViewed(storyId) {
    try {
        await window.firebase.dbFunctions.update(
            window.firebase.dbFunctions.ref(window.firebase.database, `stories/${storyId}/views`),
            {
                [currentUserId]: true
            }
        );
    } catch (error) {
        console.error('Error marking story as viewed:', error);
    }
}

function reactToStory(emoji) {
    if (currentStoryIndex >= activeUserStories.length) return;
    
    const story = activeUserStories[currentStoryIndex];
    
    try {
        window.firebase.dbFunctions.update(
            window.firebase.dbFunctions.ref(window.firebase.database, `stories/${story.id}/reactions`),
            {
                [currentUserId]: emoji
            }
        );
        
        showToast(`Reação ${emoji} enviada!`, 'success');
    } catch (error) {
        console.error('Error reacting to story:', error);
    }
}

function sendStoryMessage() {
    const inputContainer = document.getElementById('storyMessageInput');
    if (inputContainer) {
        inputContainer.classList.toggle('hidden');
    }
}

function sendStoryMessageText() {
    const input = document.getElementById('storyMessageText');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text || currentStoryIndex >= activeUserStories.length) return;
    
    const story = activeUserStories[currentStoryIndex];
    
    try {
        window.firebase.dbFunctions.push(
            window.firebase.dbFunctions.ref(window.firebase.database, `stories/${story.id}/replies`),
            {
                uid: currentUserId,
                displayName: getDisplayName(currentUser),
                text: text,
                createdAt: Date.now()
            }
        );
        
        input.value = '';
        const inputContainer = document.getElementById('storyMessageInput');
        if (inputContainer) {
            inputContainer.classList.add('hidden');
        }
        showToast('Mensagem enviada!', 'success');
        
    } catch (error) {
        console.error('Error sending story message:', error);
        showToast('Erro ao enviar mensagem', 'error');
    }
}

function openCreateStoryModal() {
    if (!currentUserId) {
        showToast('Faça login para criar stories', 'error');
        return;
    }
    
    const modal = document.getElementById('storyCreatorModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    
    const storyCreatorText = document.getElementById('storyCreatorText');
    if (storyCreatorText) storyCreatorText.focus();
    
    updateStoryPreview();
}

function closeStoryCreatorModal() {
    const modal = document.getElementById('storyCreatorModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    
    const storyCreatorText = document.getElementById('storyCreatorText');
    if (storyCreatorText) storyCreatorText.value = '';
    
    currentStoryMedia = null;
    
    const preview = document.getElementById('storyPreview');
    if (preview) {
        preview.style.background = 'linear-gradient(to right, #3b82f6, #8b5cf6)';
    }
    
    const textPreview = document.getElementById('storyTextPreview');
    if (textPreview) {
        textPreview.textContent = '';
        textPreview.style.display = 'block';
    }
    
    const imagePreview = document.getElementById('storyImagePreview');
    if (imagePreview) {
        imagePreview.classList.add('hidden');
    }
    
    const storyImageUpload = document.getElementById('storyImageUpload');
    if (storyImageUpload) storyImageUpload.value = '';
}

function updateStoryPreview() {
    const text = document.getElementById('storyCreatorText')?.value.trim() || '';
    const bgColor = document.getElementById('storyBgColor')?.value || '#3b82f6';
    const textColor = document.getElementById('storyTextColor')?.value || '#ffffff';
    const textPreview = document.getElementById('storyTextPreview');
    const preview = document.getElementById('storyPreview');
    
    if (preview) preview.style.background = bgColor;
    if (textPreview) {
        textPreview.style.color = textColor;
        textPreview.textContent = text || 'Seu texto aparecerá aqui';
    }
}

function handleStoryImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione uma imagem', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Imagem muito grande. Tamanho máximo: 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentStoryMedia = {
            file: file,
            url: e.target.result
        };
        
        const textPreview = document.getElementById('storyTextPreview');
        const imagePreview = document.getElementById('storyImagePreview');
        const previewImage = document.getElementById('storyPreviewImage');
        
        if (textPreview) textPreview.style.display = 'none';
        if (imagePreview) imagePreview.classList.remove('hidden');
        if (previewImage) previewImage.src = e.target.result;
        
        const preview = document.getElementById('storyPreview');
        if (preview) {
            preview.style.background = 'transparent';
        }
    };
    
    reader.readAsDataURL(file);
}

async function postStory() {
    const text = document.getElementById('storyCreatorText')?.value.trim() || '';
    
    if (!text && !currentStoryMedia) {
        showToast('Adicione um texto ou uma imagem para o story!', 'error');
        return;
    }
    
    try {
        const storyData = {
            uid: currentUserId,
            displayName: getDisplayName(currentUser),
            text: text,
            mediaUrl: currentStoryMedia ? currentStoryMedia.url : null,
            backgroundColor: document.getElementById('storyBgColor')?.value || '#3b82f6',
            textColor: document.getElementById('storyTextColor')?.value || '#ffffff',
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000),
            views: {},
            reactions: {},
            replies: {}
        };
        
        await window.firebase.dbFunctions.push(
            window.firebase.dbFunctions.ref(window.firebase.database, 'stories'), 
            storyData
        );
        
        closeStoryCreatorModal();
        currentStoryMedia = null;
        
        showToast('Story publicado com sucesso!', 'success');
        loadStories();
        
    } catch (error) {
        console.error('Error posting story:', error);
        showToast('Erro ao publicar story.', 'error');
    }
}

function showProfileTab(tab) {
    const tabs = ['posts', 'photos', 'videos', 'friends'];
    
    tabs.forEach(t => {
        const tabElement = document.getElementById(`profileTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        const panelElement = document.getElementById(`profile${t.charAt(0).toUpperCase() + t.slice(1)}Tab`);
        
        if (tabElement && panelElement) {
            if (tab === t) {
                tabElement.classList.add('tab-active');
                tabElement.classList.add('bg-blue-100', 'text-blue-800');
                tabElement.classList.remove('text-gray-700');
                panelElement.classList.remove('hidden');
            } else {
                tabElement.classList.remove('tab-active');
                tabElement.classList.remove('bg-blue-100', 'text-blue-800');
                tabElement.classList.add('text-gray-700');
                panelElement.classList.add('hidden');
            }
        }
    });
    
    switch(tab) {
        case 'posts':
            if (currentUserProfileData && currentUserProfileData.uid) {
                loadUserPosts(currentUserProfileData.uid);
            }
            break;
        case 'photos':
            loadProfilePhotos();
            break;
        case 'videos':
            loadProfileVideos();
            break;
        case 'friends':
            loadProfileFriends();
            break;
    }
}

async function loadUserPosts(userId) {
    const container = document.getElementById('profilePostsTab');
    if (!container) return;
    
    container.innerHTML = `
        <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    `;
    
    try {
        const postsRef = window.firebase.dbFunctions.ref(window.firebase.database, 'posts');
        const snapshot = await window.firebase.dbFunctions.get(postsRef);
        
        container.innerHTML = '';
        
        if (!snapshot.exists()) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-newspaper text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">Nenhum post encontrado.</p>
                </div>
            `;
            return;
        }
        
        const posts = [];
        snapshot.forEach(child => {
            const post = { id: child.key, ...child.val() };
            if (post.uid === userId) {
                posts.unshift(post);
            }
        });
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-newspaper text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">Nenhum post encontrado.</p>
                </div>
            `;
            return;
        }
        
        posts.sort((a, b) => b.createdAt - a.createdAt);
        
        for (const post of posts) {
            if (!allUsersCache[post.uid]) {
                try {
                    const userSnap = await window.firebase.dbFunctions.get(
                        window.firebase.dbFunctions.ref(window.firebase.database, `users/${post.uid}`)
                    );
                    if (userSnap.exists()) {
                        allUsersCache[post.uid] = userSnap.val();
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            }
        }
        
        posts.forEach(post => {
            const postContainer = document.createElement('div');
            container.appendChild(postContainer);
            renderPost(post, postContainer);
        });
        
    } catch (error) {
        console.error('Error loading user posts:', error);
        container.innerHTML = `
            <div class="text-center py-12 text-red-500">
                <i class="fas fa-exclamation-triangle text-3xl mb-4"></i>
                <p>Erro ao carregar posts do perfil.</p>
            </div>
        `;
    }
}

async function loadProfilePhotos() {
    const container = document.getElementById('profilePhotosTab');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-12">
            <i class="fas fa-images text-4xl text-gray-300 mb-4"></i>
            <p class="text-gray-500">Funcionalidade de fotos em desenvolvimento.</p>
        </div>
    `;
}

async function loadProfileVideos() {
    const container = document.getElementById('profileVideosTab');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-12">
            <i class="fas fa-video text-4xl text-gray-300 mb-4"></i>
            <p class="text-gray-500">Funcionalidade de vídeos em desenvolvimento.</p>
        </div>
    `;
}

async function loadProfileFriends() {
    const container = document.getElementById('profileFriendsTab');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-12">
            <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
            <p class="text-gray-500">Funcionalidade de amigos do perfil em desenvolvimento.</p>
        </div>
    `;
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
}

function updateFontSize(value, save = true) {
    document.documentElement.style.fontSize = `${value}rem`;
    
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (fontSizeValue) {
        if (value < 0.9) fontSizeValue.textContent = 'Pequeno';
        else if (value > 1.1) fontSizeValue.textContent = 'Grande';
        else fontSizeValue.textContent = 'Normal';
    }
    
    if (save) {
        localStorage.setItem('fontSize', value);
    }
}

function setThemeColor(color, save = true) {
    const colors = {
        blue: { from: 'from-blue-600', to: 'to-blue-700', primary: 'blue-600' },
        purple: { from: 'from-purple-600', to: 'to-purple-700', primary: 'purple-600' },
        green: { from: 'from-green-600', to: 'to-green-700', primary: 'green-600' },
        pink: { from: 'from-pink-600', to: 'to-pink-700', primary: 'pink-600' }
    };
    
    const selected = colors[color] || colors.blue;
    
    document.querySelectorAll('[class*="from-blue-"]').forEach(el => {
        el.className = el.className.replace(/from-\w+-\d+/g, selected.from);
    });
    
    document.querySelectorAll('[class*="to-blue-"]').forEach(el => {
        el.className = el.className.replace(/to-\w+-\d+/g, selected.to);
    });
    
    if (save) {
        localStorage.setItem('themeColor', color);
    }
}

async function saveSettings() {
    const displayName = document.getElementById('settingsDisplayName').value.trim();
    const bio = document.getElementById('settingsBio').value.trim();
    const privacyPublicProfile = document.getElementById('privacyPublicProfile').checked;
    const privacyShowOnline = document.getElementById('privacyShowOnline').checked;
    const privacyAllowTags = document.getElementById('privacyAllowTags').checked;
    const notificationsMessages = document.getElementById('notificationsMessages').checked;
    const notificationsFriends = document.getElementById('notificationsFriends').checked;
    const notificationsLikes = document.getElementById('notificationsLikes').checked;
    const notificationsComments = document.getElementById('notificationsComments').checked;
    
    try {
        await window.firebase.dbFunctions.update(
            window.firebase.dbFunctions.ref(window.firebase.database, `users/${currentUserId}`),
            {
                displayName: displayName,
                bio: bio,
                profilePublic: privacyPublicProfile,
                showOnlineStatus: privacyShowOnline,
                allowTags: privacyAllowTags,
                notificationsMessages: notificationsMessages,
                notificationsFriends: notificationsFriends,
                notificationsLikes: notificationsLikes,
                notificationsComments: notificationsComments,
                updatedAt: Date.now()
            }
        );
        
        currentUserProfileData = {
            ...currentUserProfileData,
            displayName: displayName,
            bio: bio,
            profilePublic: privacyPublicProfile,
            showOnlineStatus: privacyShowOnline,
            allowTags: privacyAllowTags,
            notificationsMessages: notificationsMessages,
            notificationsFriends: notificationsFriends,
            notificationsLikes: notificationsLikes,
            notificationsComments: notificationsComments
        };
        
        updateUserUI(currentUserProfileData);
        showToast('Configurações salvas com sucesso!', 'success');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Erro ao salvar configurações.', 'error');
    }
}

async function changePassword() {
    showToast('Alteração de senha deve ser feita na tela de login.', 'info');
}

function openDeleteAccountModal() {
    showToast('Exclusão de conta deve ser feita na tela de login.', 'info');
}

function closeDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function updateDeleteAccountButton() {
    // Função vazia
}

async function deleteAccount() {
    showToast('Exclusão de conta deve ser feita na tela de login.', 'info');
}

function exportData() {
    showToast('Função de exportação em desenvolvimento.', 'info');
}

async function loadUserProfile(userId) {
    if (!userId) userId = currentUserId;
    
    try {
        const userRef = window.firebase.dbFunctions.ref(window.firebase.database, `users/${userId}`);
        const snapshot = await window.firebase.dbFunctions.get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            userData.uid = userId;
            currentUserProfileData = userData;
            allUsersCache[userId] = userData;
            
            updateUserUI(userData);
            loadPosts(userId);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showToast('Erro ao carregar perfil do usuário.', 'error');
    }
}

function editProfile() {
    switchView('settings');
}

async function loadNotifications() {
    const container = document.getElementById('notificationList');
    if (!container || !currentUserId) return;
    
    container.innerHTML = `
        <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    `;
    
    try {
        const notificationsRef = window.firebase.dbFunctions.ref(
            window.firebase.database, 
            `notifications/${currentUserId}`
        );
        
        const snapshot = await window.firebase.dbFunctions.get(notificationsRef);
        
        container.innerHTML = '';
        
        if (!snapshot.exists()) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-bell-slash text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">Nenhuma notificação.</p>
                </div>
            `;
            return;
        }
        
        const notifications = [];
        snapshot.forEach(child => {
            notifications.push({ id: child.key, ...child.val() });
        });
        
        notifications.sort((a, b) => b.createdAt - a.createdAt);
        
        let unreadCount = 0;
        
        notifications.forEach(notification => {
            if (!notification.read) unreadCount++;
            
            const notificationElement = document.createElement('div');
            notificationElement.className = `bg-white p-4 rounded-lg border border-gray-200 ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`;
            
            let icon = 'fas fa-bell';
            let color = 'text-blue-500';
            let action = '';
            
            switch(notification.type) {
                case 'friend_request':
                    icon = 'fas fa-user-plus';
                    color = 'text-green-500';
                    action = 'enviou uma solicitação de amizade';
                    break;
                case 'friend_accepted':
                    icon = 'fas fa-user-check';
                    color = 'text-green-500';
                    action = 'aceitou sua solicitação de amizade';
                    break;
                case 'message':
                    icon = 'fas fa-comment';
                    color = 'text-purple-500';
                    action = 'enviou uma mensagem';
                    break;
                case 'like':
                    icon = 'fas fa-heart';
                    color = 'text-red-500';
                    action = 'curtiu seu post';
                    break;
                case 'comment':
                    icon = 'fas fa-comment-alt';
                    color = 'text-yellow-500';
                    action = 'comentou em seu post';
                    break;
                default:
                    icon = 'fas fa-bell';
                    color = 'text-blue-500';
                    action = 'enviou uma notificação';
            }
            
            notificationElement.innerHTML = `
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full ${color} bg-opacity-20 flex items-center justify-center">
                            <i class="${icon} ${color}"></i>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-800">
                            <span class="font-bold">${escapeHTML(notification.fromName || 'Alguém')}</span> 
                            ${action}
                        </p>
                        ${notification.text ? `<p class="text-xs text-gray-500 mt-1">"${escapeHTML(notification.text)}"</p>` : ''}
                        <p class="text-xs text-gray-400 mt-2">${formatDate(notification.createdAt)}</p>
                    </div>
                    <button onclick="markNotificationAsRead('${notification.id}')" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times w-4 h-4"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(notificationElement);
        });
        
        updateNotificationBadges(unreadCount);
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = `
            <div class="text-center py-12 text-red-500">
                <i class="fas fa-exclamation-triangle text-3xl mb-4"></i>
                <p>Erro ao carregar notificações: ${error.message}</p>
            </div>
        `;
    }
}

function updateNotificationBadges(count) {
    const badges = [
        document.getElementById('notificationsBadge'),
        document.getElementById('mobileNotificationsBadge')
    ];
    
    badges.forEach(badge => {
        if (badge) {
            if (count > 0) {
                badge.classList.remove('hidden');
                badge.textContent = count > 99 ? '99+' : count.toString();
            } else {
                badge.classList.add('hidden');
            }
        }
    });
}

async function markAllNotificationsAsRead() {
    try {
        const notificationsRef = window.firebase.dbFunctions.ref(window.firebase.database, `notifications/${currentUserId}`);
        const snapshot = await window.firebase.dbFunctions.get(notificationsRef);
        
        if (!snapshot.exists()) return;
        
        const updates = {};
        snapshot.forEach(child => {
            updates[`${child.key}/read`] = true;
        });
        
        await window.firebase.dbFunctions.update(notificationsRef, updates);
        
        showToast('Todas as notificações marcadas como lidas', 'success');
        loadNotifications();
        
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        showToast('Erro ao marcar notificações como lidas', 'error');
    }
}

function viewPost(postId) {
    switchView('home');
    
    setTimeout(() => {
        const postElement = document.querySelector(`[data-id="${postId}"]`);
        if (postElement) {
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            postElement.classList.add('ring-2', 'ring-blue-500');
            
            setTimeout(() => {
                postElement.classList.remove('ring-2', 'ring-blue-500');
            }, 3000);
        }
    }, 500);
}

async function loadTrends() {
    const container = document.getElementById('trendsList');
    if (!container) return;
    
    try {
        const postsRef = window.firebase.dbFunctions.ref(window.firebase.database, 'posts');
        const snapshot = await window.firebase.dbFunctions.get(postsRef);
        
        const hashtagCount = {};
        
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const post = child.val();
                const text = post.text || '';
                const hashtags = text.match(/#[\w\u00C0-\u017F]+/g) || [];
                
                hashtags.forEach(tag => {
                    const cleanTag = tag.toLowerCase();
                    hashtagCount[cleanTag] = (hashtagCount[cleanTag] || 0) + 1;
                });
            });
        }
        
        const sortedHashtags = Object.entries(hashtagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([tag, count]) => ({ tag, posts: count }));
        
        if (sortedHashtags.length === 0) {
            const defaultTrends = [
                { tag: '#NexusAO', posts: 1 },
                { tag: '#RedeSocial', posts: 1 },
                { tag: '#Compartilhar', posts: 1 }
            ];
            sortedHashtags.push(...defaultTrends);
        }
        
        container.innerHTML = sortedHashtags.map(trend => `
            <li class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-all" onclick="searchHashtag('${trend.tag}')">
                <div>
                    <p class="font-medium text-blue-600">${trend.tag}</p>
                    <p class="text-sm text-gray-500">${trend.posts} ${trend.posts === 1 ? 'post' : 'posts'}</p>
                </div>
                <i class="fas fa-chevron-right text-gray-400"></i>
            </li>
        `).join('');
        
    } catch (error) {
        console.error('Error loading trends:', error);
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Erro ao carregar tendências</p>';
    }
}

function searchHashtag(hashtag) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = hashtag;
        performSearch();
    }
    openSearchModal();
}

function loadMoreTrends() {
    showToast('Carregando mais tendências...', 'info');
    setTimeout(() => {
        loadTrends();
    }, 1000);
}

function openSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.getElementById('searchInput').focus();
    }
}

function closeSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function setSearchFilter(filter) {
    searchFilter = filter;
    
    document.querySelectorAll('.search-filter').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-100', 'text-blue-800');
        btn.classList.add('bg-gray-100', 'text-gray-800');
    });
    
    const activeBtn = document.querySelector(`.search-filter[onclick="setSearchFilter('${filter}')"]`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-100', 'text-gray-800');
        activeBtn.classList.add('active', 'bg-blue-100', 'text-blue-800');
    }
    
    performSearch();
}

function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('searchResults');
    
    if (!resultsContainer) return;
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    if (query.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-search text-3xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Digite para buscar</p>
                <p class="text-gray-400 text-sm mt-2">Busque por pessoas, posts ou hashtags</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = `
        <div class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    `;
    
    searchTimeout = setTimeout(async () => {
        try {
            let results = [];
            
            if (searchFilter === 'all' || searchFilter === 'people') {
                const usersRef = window.firebase.dbFunctions.ref(window.firebase.database, 'users');
                const snapshot = await window.firebase.dbFunctions.get(usersRef);
                
                if (snapshot.exists()) {
                    snapshot.forEach(child => {
                        const user = child.val();
                        if (user.uid !== currentUserId && 
                            (user.displayName?.toLowerCase().includes(query) || 
                             user.email?.toLowerCase().includes(query))) {
                            results.push({
                                type: 'person',
                                uid: user.uid,
                                name: user.displayName,
                                email: user.email,
                                avatarUrl: user.avatarUrl,
                                bio: user.bio
                            });
                        }
                    });
                }
            }
            
            if (searchFilter === 'all' || searchFilter === 'posts') {
                const postsRef = window.firebase.dbFunctions.ref(window.firebase.database, 'posts');
                const snapshot = await window.firebase.dbFunctions.get(postsRef);
                
                if (snapshot.exists()) {
                    snapshot.forEach(child => {
                        const post = child.val();
                        if (post.text?.toLowerCase().includes(query)) {
                            results.push({
                                type: 'post',
                                id: child.key,
                                text: post.text,
                                authorName: post.displayName,
                                authorId: post.uid,
                                createdAt: post.createdAt
                            });
                        }
                    });
                }
            }
            
            displaySearchResults(results, query);
            
        } catch (error) {
            console.error('Error performing search:', error);
            resultsContainer.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <p>Erro ao realizar busca</p>
                </div>
            `;
        }
    }, 500);
}

function displaySearchResults(results, query) {
    const container = document.getElementById('searchResults');
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-search text-3xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Nenhum resultado encontrado para "${query}"</p>
                <p class="text-gray-400 text-sm mt-2">Tente outros termos de busca</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    results.forEach(result => {
        if (result.type === 'person') {
            const resultElement = document.createElement('div');
            resultElement.className = 'flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-all';
            resultElement.onclick = () => {
                loadUserProfile(result.uid);
                closeSearchModal();
                switchView('profile');
            };
            
            resultElement.innerHTML = `
                <div class="flex-shrink-0">
                    ${createAvatarElement(result.name, 'w-10 h-10', result.avatarUrl)}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-gray-800">${escapeHTML(result.name)}</p>
                    <p class="text-sm text-gray-500 truncate">${escapeHTML(result.email || '')}</p>
                    ${result.bio ? `<p class="text-xs text-gray-500 mt-1 truncate">${escapeHTML(result.bio)}</p>` : ''}
                </div>
            `;
            
            container.appendChild(resultElement);
        } else if (result.type === 'post') {
            const resultElement = document.createElement('div');
            resultElement.className = 'p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-all';
            resultElement.onclick = () => {
                viewPost(result.id);
                closeSearchModal();
            };
            
            resultElement.innerHTML = `
                <div>
                    <p class="font-bold text-gray-800 mb-1">Post de ${escapeHTML(result.authorName)}</p>
                    <p class="text-sm text-gray-600 truncate">${escapeHTML(result.text.substring(0, 100))}${result.text.length > 100 ? '...' : ''}</p>
                    <p class="text-xs text-gray-500 mt-1">${formatDate(result.createdAt)}</p>
                </div>
            `;
            
            container.appendChild(resultElement);
        }
    });
}

function openAvatarUpload() {
    const modal = document.getElementById('avatarUploadModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeAvatarUploadModal() {
    const modal = document.getElementById('avatarUploadModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    
    currentAvatar = null;
    const avatarPreview = document.getElementById('avatarPreview');
    if (avatarPreview) {
        const avatarPreviewImage = document.getElementById('avatarPreviewImage');
        const avatarPreviewIcon = document.getElementById('avatarPreviewIcon');
        
        if (avatarPreviewImage) avatarPreviewImage.classList.add('hidden');
        if (avatarPreviewIcon) avatarPreviewIcon.classList.remove('hidden');
    }
    
    const saveButton = document.getElementById('saveAvatarButton');
    if (saveButton) {
        saveButton.disabled = true;
    }
}

function openCameraForAvatar() {
    showToast('Função de câmera em desenvolvimento', 'info');
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione uma imagem', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Imagem muito grande. Tamanho máximo: 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentAvatar = {
            file: file,
            url: e.target.result
        };
        
        const avatarPreview = document.getElementById('avatarPreview');
        if (avatarPreview) {
            const avatarPreviewImage = document.getElementById('avatarPreviewImage');
            const avatarPreviewIcon = document.getElementById('avatarPreviewIcon');
            
            if (avatarPreviewImage) {
                avatarPreviewImage.src = e.target.result;
                avatarPreviewImage.classList.remove('hidden');
            }
            if (avatarPreviewIcon) {
                avatarPreviewIcon.classList.add('hidden');
            }
        }
        
        const saveButton = document.getElementById('saveAvatarButton');
        if (saveButton) {
            saveButton.disabled = false;
        }
    };
    
    reader.readAsDataURL(file);
}

async function saveAvatar() {
    if (!currentAvatar) return;
    
    try {
        await window.firebase.dbFunctions.update(
            window.firebase.dbFunctions.ref(window.firebase.database, `users/${currentUserId}`),
            {
                avatarUrl: currentAvatar.url,
                updatedAt: Date.now()
            }
        );
        
        currentUserProfileData.avatarUrl = currentAvatar.url;
        allUsersCache[currentUserId].avatarUrl = currentAvatar.url;
        
        updateUserUI(currentUserProfileData);
        closeAvatarUploadModal();
        
        showToast('Foto de perfil atualizada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Error saving avatar:', error);
        showToast('Erro ao salvar foto de perfil', 'error');
    }
}

function openCoverUpload() {
    const coverFileInput = document.getElementById('coverFileInput');
    if (coverFileInput) {
        coverFileInput.click();
    }
}

function handleCoverUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione uma imagem', 'error');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showToast('Imagem muito grande. Tamanho máximo: 10MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentCover = {
            file: file,
            url: e.target.result
        };
        
        saveCover();
    };
    
    reader.readAsDataURL(file);
}

async function saveCover() {
    if (!currentCover) return;
    
    try {
        await window.firebase.dbFunctions.update(
            window.firebase.dbFunctions.ref(window.firebase.database, `users/${currentUserId}`),
            {
                coverUrl: currentCover.url,
                updatedAt: Date.now()
            }
        );
        
        currentUserProfileData.coverUrl = currentCover.url;
        allUsersCache[currentUserId].coverUrl = currentCover.url;
        
        updateUserUI(currentUserProfileData);
        
        showToast('Capa do perfil atualizada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Error saving cover:', error);
        showToast('Erro ao salvar capa do perfil', 'error');
    }
}

function openNotifications() {
    const notificationsSection = document.getElementById('notifications-section');
    const mainApp = document.getElementById('mainApp');

    if (notificationsSection && !notificationsSection.classList.contains('hidden')) {
        switchView('home');
    } else {
        switchView('notifications');
    }

    closeAllModals();
    loadNotifications();
}

function setupRealTimeListeners() {
    setupPostListener();
    setupNotificationsListener();
}

function setupPostListener() {
    if (postsListenerUnsub) {
        postsListenerUnsub();
    }
    
    try {
        const postsRef = window.firebase.dbFunctions.ref(window.firebase.database, 'posts');
        postsListenerUnsub = window.firebase.dbFunctions.onValue(postsRef, (snapshot) => {
            if (snapshot.exists() && document.getElementById('home-section') && !document.getElementById('home-section').classList.contains('hidden')) {
                loadPosts();
            }
        });
    } catch (error) {
        console.error('Error setting up posts listener:', error);
    }
}

function setupNotificationsListener() {
    if (notificationsListener) {
        notificationsListener();
    }
    
    try {
        const notificationsRef = window.firebase.dbFunctions.ref(window.firebase.database, `notifications/${currentUserId}`);
        notificationsListener = window.firebase.dbFunctions.onValue(notificationsRef, (snapshot) => {
            if (snapshot.exists() && document.getElementById('notifications-section') && !document.getElementById('notifications-section').classList.contains('hidden')) {
                loadNotifications();
            }
        });
    } catch (error) {
        console.error('Error setting up notifications listener:', error);
    }
}

function loadUserSettings() {
    // Já carregado pelo loadUserData
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });
}

function markNotificationAsRead(notificationId) {
    if (!notificationId || !currentUserId) return;
    
    try {
        window.firebase.dbFunctions.update(
            window.firebase.dbFunctions.ref(window.firebase.database, `notifications/${currentUserId}/${notificationId}`),
            { read: true }
        );
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// ===== LOGOUT =====
async function logout() {
    try {
        await window.firebase.authFunctions.signOut(window.firebase.auth);
        showToast('Logout realizado com sucesso', 'success');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Erro ao fazer logout', 'error');
    }
}