const socket = io();
const canvas = document.querySelector('canvas');
const startButton = document.getElementById('startGame');
const c = canvas.getContext('2d');
var gameStart = 0
var gameStarted = 0
canvas.width = innerWidth;
canvas.height = innerHeight;

socket.on('game started', () => {
    gameStart = 1
})

socket.on('new projectile', (newProjVel) => {
    newProj = new Projectile(
        canvas.width/2,
        canvas.height/2,
        5,
        'red',
        {
            x:newProjVel[0],
            y:newProjVel[1]
        }
    )
    projectiles.push(newProj);
})

class Player {
    constructor(x,y,radius,color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        c.beginPath();
        c.arc(this.x,this.y,this.radius,0,Math.PI*2,false)
        c.fillStyle = this.color
        c.fill()
    }
}

class Projectile {
    constructor(x,y,radius,color,velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x,this.y,this.radius,0,Math.PI*2,false)
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

projectiles = []

function animate() {
    requestAnimationFrame(animate)
    if (gameStart) {
        player = new Player(
            canvas.width/2,
            canvas.height/2,
            30,
            'blue'
        )

        //send a socket message that someone started the game
        socket.emit('game started')

        gameStart = 0
        gameStarted = 1
    }
    if(gameStarted){
        c.clearRect(0,0, canvas.width, canvas.height)
        player.draw()
        projectiles.forEach((projectile) => {
            projectile.update()
        })
    }
}

startButton.addEventListener('click', () => {
    gameStart = 1;
})

window.addEventListener('click', (event) => {
    angle = Math.atan2(event.clientY-canvas.height/2,event.clientX-canvas.width/2)
    xVel = Math.cos(angle)
    yVel = Math.sin(angle)
    
    newProj = new Projectile(
        canvas.width/2,
        canvas.height/2,
        5,
        'red',
        {
            x:xVel*30,
            y:yVel*30
        }
    )

    projectiles.push(newProj)

    socket.emit('new projectile', [xVel*30,yVel*30])
})


animate();

