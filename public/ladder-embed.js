// Standalone Ladder Embed Script
// This can be included in any website to display the ladder

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        backendUrl: 'https://newapp-1-ic1v.onrender.com',
        defaultLadder: '499-under',
        containerId: 'ladder-embed-container'
    };
    
    // Create the embed container
    function createEmbedContainer() {
        const container = document.createElement('div');
        container.id = CONFIG.containerId;
        container.style.cssText = `
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #fff;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;
        return container;
    }
    
    // Create loading state
    function createLoadingState() {
        return `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 24px; margin-bottom: 10px;">🏆</div>
                <div>Loading ladder data...</div>
            </div>
        `;
    }
    
    // Create error state
    function createErrorState(message) {
        return `
            <div style="text-align: center; padding: 40px; color: #e53e3e;">
                <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
                <div>${message}</div>
            </div>
        `;
    }
    
    // Get ladder display name
    function getLadderDisplayName(ladder) {
        switch (ladder) {
            case '499-under': return '499 & Under';
            case '500-549': return '500-549';
            case '550-plus': return '550+';
            default: return ladder;
        }
    }
    
    // Create ladder table
    function createLadderTable(players, ladderName) {
        if (players.length === 0) {
            return createErrorState('No players found in this ladder');
        }
        
        let html = `
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e53e3e; padding-bottom: 15px;">
                <h1 style="margin: 0 0 5px 0; font-size: 24px; color: #e53e3e; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
                    Ladder of Legends
                </h1>
                <h2 style="margin: 0; font-size: 18px; color: #ccc; font-weight: normal;">
                    ${getLadderDisplayName(ladderName)} Ladder
                </h2>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; overflow: hidden;">
                <div style="display: grid; grid-template-columns: 60px 1fr 80px 50px 50px 80px; background: linear-gradient(135deg, #e53e3e, #c53030); color: white; font-weight: bold; font-size: 14px; padding: 12px 8px; text-align: center;">
                    <div>Rank</div><div>Player</div><div>Fargo</div><div>W</div><div>L</div><div>Status</div>
                </div>
        `;
        
        players.forEach((player, index) => {
            const statusClass = !player.isActive ? 'inactive' : 
                              (player.immunityUntil && new Date(player.immunityUntil) > new Date()) ? 'immune' : 'active';
            const statusText = !player.isActive ? 'Inactive' : 
                             (player.immunityUntil && new Date(player.immunityUntil) > new Date()) ? 'Immune' : 'Active';
            const statusColor = !player.isActive ? '#f44336' : 
                              (player.immunityUntil && new Date(player.immunityUntil) > new Date()) ? '#ff9800' : '#4CAF50';
            
            html += `
                <div style="display: grid; grid-template-columns: 60px 1fr 80px 50px 50px 80px; padding: 10px 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 14px; align-items: center; background: ${index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'}; transition: background-color 0.2s ease;" onmouseover="this.style.background='rgba(229, 62, 62, 0.1)'" onmouseout="this.style.background='${index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'}'">
                    <div style="text-align: center; font-weight: bold; color: #e53e3e;">#${player.position}</div>
                    <div style="padding-left: 8px; font-weight: 500;">${player.firstName} ${player.lastName}</div>
                    <div style="text-align: center; color: #ccc;">${player.fargoRate === 0 ? 'N/A' : player.fargoRate}</div>
                    <div style="text-align: center; color: #4CAF50; font-weight: bold;">${player.wins || 0}</div>
                    <div style="text-align: center; color: #f44336; font-weight: bold;">${player.losses || 0}</div>
                    <div style="text-align: center; font-size: 12px; color: ${statusColor};">${statusText}</div>
                </div>
            `;
        });
        
        html += `
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #888; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 15px;">
                <p style="margin: 5px 0;"><strong>Challenge Rules:</strong> Standard challenges up to 4 positions above, SmackDown up to 5 positions below</p>
                <p style="margin: 5px 0;"><strong>Anyone can view the ladder - no account required!</strong></p>
                <p style="margin: 5px 0; color: #e53e3e;"><strong>⚠️ INDEPENDENT TOURNAMENT SERIES ⚠️</strong></p>
                <p style="margin: 5px 0; font-size: 11px;">
                    This ladder system is <strong>NOT</strong> affiliated with, endorsed by, or sanctioned by the Front Range Pool League,<br/>
                    CueSports International, BCA Pool League, or USA Pool League.<br/>
                    It is an independent tournament series operated by <strong>Legends Brews and Cues</strong>.
                </p>
            </div>
        `;
        
        return html;
    }
    
    // Load ladder data
    async function loadLadderData(ladderName) {
        try {
            const response = await fetch(`${CONFIG.backendUrl}/api/ladder/embed/${ladderName}`);
            
            if (response.ok) {
                const data = await response.json();
                return data.players || [];
            } else {
                throw new Error('Failed to load ladder data');
            }
        } catch (err) {
            console.error('Error loading ladder data:', err);
            throw err;
        }
    }
    
    // Initialize the embed
    function initEmbed(options = {}) {
        const ladderName = options.ladder || CONFIG.defaultLadder;
        const container = createEmbedContainer();
        
        // Insert container into the page
        const targetElement = document.getElementById(options.targetId || CONFIG.containerId);
        if (targetElement) {
            targetElement.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
        
        // Show loading state
        container.innerHTML = createLoadingState();
        
        // Load and display data
        loadLadderData(ladderName)
            .then(players => {
                container.innerHTML = createLadderTable(players, ladderName);
            })
            .catch(err => {
                container.innerHTML = createErrorState(err.message);
            });
    }
    
    // Auto-initialize if data attributes are found
    document.addEventListener('DOMContentLoaded', function() {
        const embedElements = document.querySelectorAll('[data-ladder-embed]');
        embedElements.forEach(element => {
            const ladderName = element.getAttribute('data-ladder-embed');
            initEmbed({
                targetId: element.id,
                ladder: ladderName
            });
        });
    });
    
    // Expose global function for manual initialization
    window.LadderEmbed = {
        init: initEmbed,
        load: loadLadderData
    };
    
})();
