const SHIP_TYPES = {
    battleship: { name: '戦艦', hp: 200, maxSpeed: 0.45, accel: 0.002, weapons: [1, 5] },
    destroyer: { name: '駆逐艦', hp: 80, maxSpeed: 0.85, accel: 0.005, weapons: [1, 2, 5] },
    carrier: { name: '航空母艦', hp: 120, maxSpeed: 0.55, accel: 0.002, weapons: [1, 4, 5] },
    cruiser: { name: '巡洋艦', hp: 150, maxSpeed: 0.65, accel: 0.003, weapons: [1, 3, 5] }
};

const WEAPON_CONFIG = {
    1: { name: '主砲', reload: 1.5 },
    2: { name: '魚雷', reload: 6.0 },
    3: { name: '高角砲', reload: 0.8 },
    4: { name: '艦載機', reload: 10.0 },
    5: { name: '緊急修理', reload: 100.0 }
};

const gameState = {
    score: 0,
    health: 100,
    maxHealth: 100,
    currentSpeed: 0,
    shipType: null,
    activeWeapon: 1,
    reloads: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isGameOver: false,
    enemies: [],
    projectiles: [],
    particles: [],
    planes: [],
    identifiedEnemyIds: new Set(),
    isRepairing: false,
    repairTimer: 0,
    repairTotalAmount: 0,
    stats: {
        shellHits: 0,
        shellTypes: { miss: 0, normal: 0, crit: 0 },
        torpedoHits: 0,
        planeHits: 0,
        sinkings: 0,
        damageReceived: 0,
        targetsIdentified: 0
    }
};

let scene, camera, renderer, clock, playerShip, ocean;
let minimapCanvas, minimapCtx;
const keys = {};
const raycaster = new THREE.Raycaster();

function startGame(type) {
    gameState.shipType = SHIP_TYPES[type];
    gameState.health = gameState.shipType.hp;
    gameState.maxHealth = gameState.shipType.hp;

    document.getElementById('selection-screen').style.display = 'none';
    document.getElementById('ui-layer').style.display = 'block';
    document.getElementById('minimap-container').style.display = 'block';
    document.getElementById('crosshair').style.display = 'block';
    document.getElementById('compass-container').style.display = 'block';

    [1, 2, 3, 4, 5].forEach(n => {
        const el = document.getElementById(`w${n}`);
        if (!gameState.shipType.weapons.includes(n)) el.style.opacity = '0.2';
    });
    updateWeaponUI();
    init();
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.Fog(0x050510, 50, 1500);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    minimapCanvas = document.getElementById('minimap-canvas');
    minimapCtx = minimapCanvas.getContext('2d');
    minimapCanvas.width = 200;
    minimapCanvas.height = 200;

    clock = new THREE.Clock();

    scene.add(new THREE.AmbientLight(0x404040, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    const oceanGeo = new THREE.PlaneGeometry(30000, 30000, 1, 1);
    const oceanMat = new THREE.MeshPhongMaterial({ color: 0x001e3d, shininess: 90 });
    ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    scene.add(ocean);

    createPlayerShip();

    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', (e) => keys[e.code] = false);
    window.addEventListener('mousedown', (e) => { if (e.button === 0) onAction(); });
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);

    animate();
    spawnLoop();
}

function handleKey(e) {
    keys[e.code] = true;
    if (e.code === 'Space') { onAction(); return; }

    if (e.key === '5') {
        useRepair();
        return;
    }

    let weaponChanged = false;
    if (e.key === '1' && gameState.shipType.weapons.includes(1)) { gameState.activeWeapon = 1; weaponChanged = true; }
    if (e.key === '2' && gameState.shipType.weapons.includes(2)) { gameState.activeWeapon = 2; weaponChanged = true; }
    if (e.key === '3' && gameState.shipType.weapons.includes(3)) { gameState.activeWeapon = 3; weaponChanged = true; }
    if (e.key === '4' && gameState.shipType.weapons.includes(4)) { gameState.activeWeapon = 4; weaponChanged = true; }

    if (weaponChanged) {
        updateWeaponUI();
        updateCameraFOV();
    }
}

function useRepair() {
    if (gameState.reloads[5] > 0 || gameState.isGameOver) return;

    gameState.isRepairing = true;
    gameState.repairTimer = 6.0;
    gameState.repairTotalAmount = gameState.maxHealth * 0.25;
    gameState.reloads[5] = WEAPON_CONFIG[5].reload;

    createExplosion(playerShip.position, 0x00ff00, 30);
}

function updateWeaponUI() {
    [1, 2, 3, 4, 5].forEach(n => {
        const el = document.getElementById(`w${n}`);
        if (el) el.classList.toggle('active-weapon', gameState.activeWeapon === n);
    });
}

function updateCameraFOV() {
    const isZoomWeapon = (gameState.activeWeapon === 3 || gameState.activeWeapon === 4);
    const targetFOV = isZoomWeapon ? 35 : 75;
    camera.fov = targetFOV;
    camera.updateProjectionMatrix();
}

function createPlayerShip() {
    playerShip = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 8), new THREE.MeshPhongMaterial({ color: 0x556677 }));
    hull.position.y = 0.5;
    playerShip.add(hull);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 2), new THREE.MeshPhongMaterial({ color: 0x445566 }));
    bridge.position.y = 1.7;
    playerShip.add(bridge);

    scene.add(playerShip);
    camera.position.set(0, 10, -22);
    camera.lookAt(0, 2, 12);
    playerShip.add(camera);
}

function onMouseMove(e) {
    if (gameState.isGameOver) return;
    if (document.pointerLockElement) {
        playerShip.rotation.y -= e.movementX * 0.002;
    }
}

function onAction() {
    if (!document.pointerLockElement) {
        renderer.domElement.requestPointerLock();
        return;
    }
    if (gameState.isGameOver) return;

    if (gameState.reloads[gameState.activeWeapon] > 0) return;

    const targetPos = getMouseWorldPos();
    let fired = false;

    switch (gameState.activeWeapon) {
        case 1: fireMainGun(); fired = true; break;
        case 2: fireTorpedo(); fired = true; break;
        case 3: fireHighAngleGun(targetPos); fired = true; break;
        case 4: launchPlanes(); fired = true; break;
    }

    if (fired) {
        gameState.reloads[gameState.activeWeapon] = WEAPON_CONFIG[gameState.activeWeapon].reload;
    }
}

function getMouseWorldPos() {
    raycaster.setFromCamera({ x: 0, y: 0.2 }, camera);
    const intersects = raycaster.intersectObject(ocean);
    return intersects.length > 0 ? intersects[0].point : null;
}

function updateScore(points) {
    gameState.score += points;
    document.getElementById('score-display').innerText = `SCORE: ${gameState.score}`;
}

function healPlayer(amount) {
    gameState.health = Math.min(gameState.maxHealth, gameState.health + amount);
    updateUI();
}

function fireMainGun() {
    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(playerShip.quaternion);
    createProjectile(playerShip.position, dir, 'player', 'shell');
}

function fireTorpedo() {
    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(playerShip.quaternion);
    createProjectile(playerShip.position, dir, 'player', 'torpedo');
}

function fireHighAngleGun(pos) {
    if (!pos) return;
    createExplosion(new THREE.Vector3(pos.x, 15, pos.z), 0xffffff, 25);
    gameState.planes.forEach(p => {
        if (p.position.distanceTo(new THREE.Vector3(pos.x, 15, pos.z)) < 30) {
            p.userData.hp = 0;
        }
    });
}

function launchPlanes() {
    const forwardDistance = 500;
    const tPos = playerShip.position.clone().add(new THREE.Vector3(0, 0, forwardDistance).applyQuaternion(playerShip.quaternion));

    for (let i = 0; i < 3; i++) {
        const plane = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.8), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
        const startPos = playerShip.position.clone().add(new THREE.Vector3(i - 1, 8, 0));
        plane.position.copy(startPos);

        plane.userData = {
            start: startPos,
            target: tPos.clone().add(new THREE.Vector3(Math.random() * 40 - 20, 0, Math.random() * 40 - 20)),
            hp: 1,
            progress: 0,
            speed: 0.004 + Math.random() * 0.002,
            peakHeight: 50 + Math.random() * 20,
            attacking: false,
            attackTarget: null
        };
        scene.add(plane);
        gameState.planes.push(plane);
    }
}

function createProjectile(start, dir, owner, type) {
    let geo;
    if (type === 'torpedo') {
        geo = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
    } else {
        geo = new THREE.SphereGeometry(0.35);
    }

    const mat = new THREE.MeshBasicMaterial({
        color: type === 'torpedo' ? 0x00ffff : (owner === 'player' ? 0xffcc00 : 0xff3300)
    });
    const p = new THREE.Mesh(geo, mat);
    const spawnPos = start.clone().add(new THREE.Vector3(0, type === 'torpedo' ? -0.2 : 1.5, 0));
    p.position.copy(spawnPos);

    if (type === 'torpedo') {
        p.rotation.x = Math.PI / 2;
        p.lookAt(spawnPos.clone().add(dir));
    }

    p.userData = {
        velocity: dir.clone().multiplyScalar(type === 'torpedo' ? 1.2 : 4.2),
        owner, type, life: 600
    };
    scene.add(p);
    gameState.projectiles.push(p);
}

function createExplosion(pos, color = 0xffaa00, count = 20) {
    for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshBasicMaterial({ color }));
        p.position.copy(pos);
        p.userData = {
            velocity: new THREE.Vector3((Math.random() - 0.5), Math.random(), (Math.random() - 0.5)).multiplyScalar(0.8),
            life: 1.0
        };
        scene.add(p);
        gameState.particles.push(p);
    }
}

function update() {
    if (gameState.isGameOver) return;
    const delta = clock.getDelta();

    // リロードの更新
    Object.keys(gameState.reloads).forEach(key => {
        if (gameState.reloads[key] > 0) {
            gameState.reloads[key] = Math.max(0, gameState.reloads[key] - delta);
        }
    });

    // 修理の処理
    if (gameState.isRepairing) {
        const step = (gameState.repairTotalAmount / 6.0) * delta;
        healPlayer(step);
        gameState.repairTimer -= delta;
        if (gameState.repairTimer <= 0) {
            gameState.isRepairing = false;
        }
    }

    // リロードバーの更新
    const currentReload = gameState.reloads[gameState.activeWeapon];
    const maxReload = WEAPON_CONFIG[gameState.activeWeapon].reload;
    const reloadPercent = currentReload > 0 ? (1 - (currentReload / maxReload)) * 100 : 100;
    document.getElementById('reload-bar').style.width = reloadPercent + '%';

    // 修理十字アイコンの更新
    const repairReload = gameState.reloads[5];
    const repairMax = WEAPON_CONFIG[5].reload;
    const repairPercent = repairReload > 0 ? (1 - (repairReload / repairMax)) * 100 : 100;
    const fillEl = document.getElementById('repair-fill');
    fillEl.setAttribute('height', repairPercent);
    fillEl.setAttribute('y', 100 - repairPercent);

    const ship = gameState.shipType;
    if (keys['KeyW']) gameState.currentSpeed = Math.min(ship.maxSpeed, gameState.currentSpeed + ship.accel);
    else if (keys['KeyS']) gameState.currentSpeed = Math.max(-ship.maxSpeed / 2, gameState.currentSpeed - ship.accel);
    else {
        if (gameState.currentSpeed > 0) gameState.currentSpeed = Math.max(0, gameState.currentSpeed - 0.001);
        if (gameState.currentSpeed < 0) gameState.currentSpeed = Math.min(0, gameState.currentSpeed + 0.001);
    }

    if (keys['KeyA']) playerShip.rotation.y += 0.015;
    if (keys['KeyD']) playerShip.rotation.y -= 0.015;

    const moveDir = new THREE.Vector3(0, 0, gameState.currentSpeed).applyQuaternion(playerShip.quaternion);
    playerShip.position.add(moveDir);

    const knots = (gameState.currentSpeed * 60).toFixed(1);
    document.getElementById('speed-display').innerText = `SPEED: ${knots} kt`;

    updateCompass();
    ocean.position.x = playerShip.position.x;
    ocean.position.z = playerShip.position.z;

    // Projectiles
    let torpedoNear = false;
    let torpedoDirTxt = "";
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const p = gameState.projectiles[i];
        p.position.add(p.userData.velocity);
        p.userData.life--;

        if (p.userData.owner === 'enemy' && p.userData.type === 'torpedo') {
            const dist = p.position.distanceTo(playerShip.position);
            if (dist < 120) {
                torpedoNear = true;
                const localP = p.position.clone().sub(playerShip.position).applyQuaternion(playerShip.quaternion.clone().invert());
                if (localP.z > 5) torpedoDirTxt = "前方";
                else if (localP.z < -5) torpedoDirTxt = "後方";
                else if (localP.x > 0) torpedoDirTxt = "右方";
                else torpedoDirTxt = "左方";
            }
        }

        if (p.userData.owner === 'player') {
            gameState.enemies.forEach((en, idx) => {
                if (p.position.distanceTo(en.position) < 14) {
                    if (p.userData.type === 'torpedo') {
                        en.userData.hp -= 12;
                        gameState.stats.torpedoHits++;
                        updateScore(1000);
                    } else {
                        const rand = Math.random();
                        if (rand < 0.2) { en.userData.hp -= 0.5; gameState.stats.shellTypes.miss++; updateScore(20); }
                        else if (rand < 0.8) { en.userData.hp -= 1.0; gameState.stats.shellTypes.normal++; updateScore(150); }
                        else { en.userData.hp -= 4.0; gameState.stats.shellTypes.crit++; updateScore(600); }
                        gameState.stats.shellHits++;
                    }
                    createExplosion(p.position);
                    p.userData.life = 0;
                    if (en.userData.hp <= 0) sinkEnemy(en, idx);
                }
            });
        } else {
            if (p.position.distanceTo(playerShip.position) < 8) {
                const dmg = (p.userData.type === 'torpedo' ? 50 : 10);
                gameState.health -= dmg;
                gameState.stats.damageReceived++;
                updateUI();
                createExplosion(p.position, 0xffffff);
                p.userData.life = 0;
                if (gameState.health <= 0) endGame();
            }
        }

        if (p.userData.life <= 0) { scene.remove(p); gameState.projectiles.splice(i, 1); }
    }
    const warnUI = document.getElementById('warning-ui');
    warnUI.style.display = torpedoNear ? 'block' : 'none';
    document.getElementById('torpedo-dir').innerText = torpedoDirTxt;

    // Enemy Logic
    gameState.enemies.forEach(en => {
        en.lookAt(playerShip.position);
        const dist = en.position.distanceTo(playerShip.position);
        if (dist < 650 && !gameState.identifiedEnemyIds.has(en.uuid)) {
            gameState.identifiedEnemyIds.add(en.uuid);
            gameState.stats.targetsIdentified++;
        }
        if (dist > 350) en.position.add(new THREE.Vector3().subVectors(playerShip.position, en.position).normalize().multiplyScalar(0.3));
        const now = clock.elapsedTime;
        if (now - en.userData.lastFire > 6.0) {
            const type = Math.random() > 0.8 ? 'torpedo' : 'shell';
            const dir = new THREE.Vector3().subVectors(playerShip.position, en.position).normalize();
            createProjectile(en.position, dir, 'enemy', type);
            en.userData.lastFire = now;
        }
    });

    // Planes Logic
    for (let i = gameState.planes.length - 1; i >= 0; i--) {
        const p = gameState.planes[i];
        p.userData.progress += p.userData.speed;
        const t = p.userData.progress;

        if (!p.userData.attacking && t < 0.8) {
            for (let en of gameState.enemies) {
                const flatDist = new THREE.Vector2(p.position.x - en.position.x, p.position.z - en.position.z).length();
                if (flatDist < 50) {
                    p.userData.attacking = true;
                    p.userData.attackTarget = en;
                    p.material.color.set(0xff4444);
                    break;
                }
            }
        }

        if (t >= 1.0 || p.userData.hp <= 0) {
            if (p.userData.hp > 0) {
                createExplosion(p.position, 0xffcc00, 50);
                const radius = p.userData.attacking ? 60 : 40;
                gameState.enemies.forEach((en, idx) => {
                    if (en.position.distanceTo(p.position) < radius) {
                        en.userData.hp -= 5.0;
                        gameState.stats.planeHits++;
                        updateScore(400);
                        if (en.userData.hp <= 0) sinkEnemy(en, idx);
                    }
                });
            }
            scene.remove(p);
            gameState.planes.splice(i, 1);
            continue;
        }

        let currentPos;
        if (p.userData.attacking && p.userData.attackTarget && p.userData.attackTarget.parent) {
            const diveT = (t - 0.2) / 0.8;
            currentPos = new THREE.Vector3().lerpVectors(p.position, p.userData.attackTarget.position, 0.1);
            p.lookAt(p.userData.attackTarget.position);
            p.position.copy(currentPos);
        } else {
            currentPos = new THREE.Vector3().lerpVectors(p.userData.start, p.userData.target, t);
            const parabola = Math.sin(t * Math.PI) * p.userData.peakHeight;
            currentPos.y += parabola;
            p.lookAt(currentPos.clone().add(new THREE.Vector3().subVectors(currentPos, p.position)));
            p.position.copy(currentPos);
        }
    }

    // Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.position.add(p.userData.velocity);
        p.userData.life -= 0.015;
        p.scale.setScalar(p.userData.life);
        if (p.userData.life <= 0) { scene.remove(p); gameState.particles.splice(i, 1); }
    }

    drawMinimap();
}

function sinkEnemy(en, idx) {
    createExplosion(en.position, 0xff4400, 80);
    scene.remove(en);
    gameState.enemies.splice(idx, 1);
    updateScore(3000);
    gameState.stats.sinkings++;
}

function updateCompass() {
    const rad = playerShip.rotation.y;
    const deg = (rad * (180 / Math.PI)) % 360;
    const normDeg = deg < 0 ? deg + 360 : deg;
    let dir = "N";
    if (normDeg >= 337.5 || normDeg < 22.5) dir = "北";
    else if (normDeg >= 22.5 && normDeg < 67.5) dir = "北西";
    else if (normDeg >= 67.5 && normDeg < 112.5) dir = "西";
    else if (normDeg >= 112.5 && normDeg < 157.5) dir = "南西";
    else if (normDeg >= 157.5 && normDeg < 202.5) dir = "南";
    else if (normDeg >= 202.5 && normDeg < 247.5) dir = "南東";
    else if (normDeg >= 247.5 && normDeg < 292.5) dir = "東";
    else if (normDeg >= 292.5 && normDeg < 337.5) dir = "北東";
    document.getElementById('compass-container').innerText = `${dir} (${Math.floor(normDeg)}°)`;
}

function drawMinimap() {
    const ctx = minimapCtx;
    ctx.clearRect(0, 0, 200, 200);

    const centerX = 100;
    const centerY = 100;
    const scale = 0.15;

    ctx.strokeStyle = "rgba(0, 212, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= 200; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 200); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(200, x); ctx.stroke();
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-playerShip.rotation.y);
    ctx.fillStyle = "#00d4ff";
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 8); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill();
    ctx.restore();

    gameState.enemies.forEach(en => {
        const dx = (en.position.x - playerShip.position.x) * scale;
        const dz = (en.position.z - playerShip.position.z) * scale;
        if (Math.abs(dx) < 100 && Math.abs(dz) < 100) {
            ctx.fillStyle = "#ff4757";
            ctx.beginPath(); ctx.arc(centerX + dx, centerY - dz, 4, 0, Math.PI * 2); ctx.fill();
        }
    });

    gameState.projectiles.forEach(p => {
        if (p.userData.owner === 'player' && p.userData.type === 'torpedo') {
            const dx = (p.position.x - playerShip.position.x) * scale;
            const dz = (p.position.z - playerShip.position.z) * scale;
            if (Math.abs(dx) < 100 && Math.abs(dz) < 100) {
                ctx.fillStyle = "#00ffff";
                ctx.beginPath(); ctx.arc(centerX + dx, centerY - dz, 2, 0, Math.PI * 2); ctx.fill();
            }
        }
    });

    gameState.planes.forEach(p => {
        const dx = (p.position.x - playerShip.position.x) * scale;
        const dz = (p.position.z - playerShip.position.z) * scale;
        if (Math.abs(dx) < 100 && Math.abs(dz) < 100) {
            ctx.fillStyle = "#ffff00";
            ctx.beginPath(); ctx.arc(centerX + dx, centerY - dz, 3, 0, Math.PI * 2); ctx.fill();
        }
    });
}

function spawnLoop() {
    if (gameState.isGameOver) return;
    if (gameState.enemies.length < 12) {
        const en = new THREE.Group();
        const hull = new THREE.Mesh(new THREE.BoxGeometry(5, 2.5, 15), new THREE.MeshPhongMaterial({ color: 0xaa3333 }));
        hull.position.y = 1.25; en.add(hull);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 4), new THREE.MeshPhongMaterial({ color: 0x882222 }));
        bridge.position.y = 3.5; en.add(bridge);
        const angle = Math.random() * Math.PI * 2;
        const d = 900 + Math.random() * 600;
        en.position.set(playerShip.position.x + Math.cos(angle) * d, 0, playerShip.position.z + Math.sin(angle) * d);
        en.userData = { hp: 18, lastFire: clock.elapsedTime + Math.random() * 5 };
        scene.add(en);
        gameState.enemies.push(en);
    }
    setTimeout(spawnLoop, 3000);
}

function updateUI() {
    document.getElementById('health-bar').style.width = (gameState.health / gameState.maxHealth * 100) + '%';
}

function endGame() {
    gameState.isGameOver = true;
    document.exitPointerLock();
    const res = gameState.stats;
    const container = document.getElementById('result-stats');
    container.innerHTML = `
                <div class="result-item"><span>最終スコア:</span> <span style="color:#fdbb2d;font-weight:bold">${gameState.score}</span></div>
                <div class="result-item"><span>標的確認数:</span> <span>${res.targetsIdentified}</span></div>
                <div class="result-item"><span>撃沈数:</span> <span>${res.sinkings}</span></div>
                <div class="result-item"><span>砲撃命中数:</span> <span>${res.shellHits}</span></div>
                <div class="result-sub"><span>- 貫通:</span> <span>${res.shellTypes.crit}</span></div>
                <div class="result-sub"><span>- 命中:</span> <span>${res.shellTypes.normal}</span></div>
                <div class="result-item"><span>魚雷命中数:</span> <span>${res.torpedoHits}</span></div>
                <div class="result-item"><span>空爆命中数:</span> <span>${res.planeHits}</span></div>
            `;
    document.getElementById('game-over').style.display = 'block';
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}
