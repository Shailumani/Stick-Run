var imageStore = new function() {
	// Buffer all images before the game starts and store them so that no more loading of images is required.
	this.background = new Image();
	// this.character = new Image();
	this.obstacles = [new Image(), new Image(), new Image(), new Image()];	//array of images for random obstacles
	this.characters = [new Image(), new Image(), new Image(), new Image(), new Image()];
	var numImages = 10;
	var numLoaded = 0;
	function imageLoaded(){	//check if all the images have been loaded, if yes then start the game
		numLoaded++;
		if(numLoaded == numImages){
			window.init();
		}
	}
	for (var i = 0; i < this.obstacles.length; i++) {	//call imageLoaded function after each image of the obstacle array is loaded.
		this.obstacles[i].onload=function(){
			imageLoaded();
		}
	};
	for (var i = 0; i < this.characters.length; i++) {	//call imageLoaded function after each image of the obstacle array is loaded.
		this.characters[i].onload=function(){
			imageLoaded();
		}
	};
	this.background.onload=function(){
		imageLoaded();
	}
	// this.character.onload=function(){
	// 	imageLoaded();
	// }
	for (var i = 1; i < this.obstacles.length+1; i++) {	//define sources for all the images
		this.obstacles[i-1].src="img/obstacles/"+i+".png";
	};	
	for (var i = 1; i < this.characters.length+1; i++) {	//define sources for all the images
		this.characters[i-1].src="img/characters/"+i+".png";
	};	
	this.background.src = "img/bg.png";
	// this.character.src = "img/character.png";
};
function Pool(maxSize){	//create a pool of obstacles from where we can pick up obstacles and make them visible whenever necessary
	size = maxSize;
	this.pool = [];
	this.init = function(){	//Initialize the pool with obstacles
		for (var i = 0; i < size; i++) {
			var obstacle = new Obstacle();
			obstacle.init(0, 0, imageStore.obstacles[0].width, imageStore.obstacles[0].height);
			this.pool[i] = obstacle;
		}
	};

	this.get = function(x, y, id){	//function to make a new obstacle alive in the pool
		if(!this.pool[size-1].alive){	//get a new obstacle iff the last obstacle in pool is not alive
			this.pool[size-1].spawn(x, y, id);
			this.pool.unshift(this.pool.pop());	//pop the obstacle which was spawned and push it to the start of the array, thus maintaining used obstacles at the front of the array
		}
	};

	this.animate = function(){	//continue the animation of obstacles, if any obstacle has gone out of screen, clear its details and push it to the end of array.
		for (var i = 0; i < size; i++) {
			if(this.pool[i].alive){
				if(this.pool[i].draw()){	//execute only if the obstacle has gone out of screen
					this.pool[i].clear();
					this.pool.push((this.pool.splice(i, 1))[0]);
				}
			}
			else{
				break;
			}
		}
	};
}
var characterId=1;	//Id of image to be used for character. This will be changed dynamically to make illusion of running
var changeTime=90;	//A quantification of time after which image of character will be changed
function Drawable() {	//Abstract class for each drawable item.
	this.init = function(x, y, width, height){	//initialize the item.
		this.x=x;
		this.y=y;
		this.initY=this.y;
		this.width=width;
		this.height=height;
	};
	this.speed=0;
	this.canvasWidth=0;
	this.canvasHeight=0;

	this.draw = function(){	//An abstract function to be implemented in each drawable item
	};
}
function Background(){	//Child class of drawable for the background
	this.speed=-7;	//Speed with which background moves
	this.draw=function(){	//animate the background.
		this.x+=this.speed;	//change the x-coordinate of left-top corner of background
		this.context.drawImage(imageStore.background, this.x, this.y);	//draw the new background at new coordinates
		this.context.drawImage(imageStore.background, this.x - (this.speed/Math.abs(this.speed))*this.canvasWidth, this.y);	//draw another background where the current one ends to show continuity
		if(Math.abs(this.x)>=this.canvasWidth){	//reset x-coordinage to 0 if the background has entirely crossed the screen.	
			this.x=0;
		}
	};
}
Background.prototype=new Drawable();	//Make background the child class of Drawable
function Character(){
	// var counter = 0;
	this.speed=15;	//the speed of the character
	this.changeNow=0;	//variable to keep track of the time when image of character is to be changed
	this.initUpSpeed=40;	//initial up speed of character while jumping
	this.isUp=false;	//variable to check if the character is in air
	this.upSpeed=this.initUpSpeed;	//current up speed of the character
	this.g=-3;	//acceleration due to gravity
	this.draw=function(){	//draw the character at current coordinates
		this.context.drawImage(imageStore.characters[characterId-1], this.x, this.y);
	};
	this.remove = function(){
		this.width=imageStore.characters[characterId-1].width;	//update the width
		this.height=imageStore.characters[characterId-1].height;	//update the height
		this.context.clearRect(this.x, this.y, this.width, this.height);	//clear the last image
	};
	this.move = function(){	//animate the character by listening to different key presses
		this.width=imageStore.characters[characterId-1].width;	//update the width
		this.height=imageStore.characters[characterId-1].height;	//update the height
		this.context.clearRect(this.x, this.y, this.width, this.height);	//clear the last image
		if (KEY_STATUS.up==true || this.isUp==true){	//use simple physics to jump the character when up is pressed
			this.isUp=true;
			characterId=5;	//change image to the jumping one
			if(this.upSpeed>(-this.initUpSpeed)){
				this.y -= this.upSpeed;
				this.upSpeed += this.g;
			}
			else{
				this.y=this.initY;
				this.upSpeed=this.initUpSpeed;
				this.isUp=false;
			}
		}
		if (KEY_STATUS.left){	//move the character to left considering the relative speed with background
			if(this.isUp==false && this.changeNow>=changeTime){	//change image if enough time has passed
				characterId-=1;
				this.changeNow=0;
			}
			if(characterId<2){
				characterId=5;
			}
			this.x -= (this.speed - game.background.speed);
			if(this.x<=0){
				this.x=0;
			}
		}
		else if (KEY_STATUS.right){	//move the character to right considering the relative speed with background
			if(this.isUp==false && this.changeNow>=changeTime){
				characterId+=1;
				this.changeNow=0;
			}
			if(characterId>5){
				characterId=2;
			}
			this.x += (this.speed + game.background.speed);
			if(this.x>=this.canvasWidth - this.width){
				this.x=this.canvasWidth - this.width;
			}
		}
		else{	//if nothing is done, move with the background
			characterId=1;	//image for standing
			this.x += game.background.speed;	
			if(this.x<=0){
				this.x=0;
			}
		}
		this.changeNow+=this.speed;
		this.draw();
	};
}
Character.prototype=new Drawable();
function Obstacle(){	//class for each obstacle
	this.alive=false;	//variable to know if the obstacle is on screen or not
	this.spawn = function(x, y, id){	//generate a new obstacle and bring it to the screen
		this.x=x;
		this.y=y;
		this.id=id;
		this.width=imageStore.obstacles[id].width;
		this.height=imageStore.obstacles[id].height;
		// this.speed=speed;
		this.alive=true;
	};
	this.draw=function(){
		this.context.clearRect(this.x, this.y, this.width, this.height);	//clear the last image of this obstacle
		this.x += game.background.speed;	//update the x-coordinate
		if(this.x <= 0-this.width){	//return true if the obstacle has gone out of screen
			return true;
		}
		else{
			this.context.drawImage(imageStore.obstacles[this.id], this.x, this.y);
		}
	};
	this.remove = function(){	//remove the obstacle
		this.context.clearRect(this.x, this.y, this.width, this.height);
	};

	this.clear=function(){	//reset the obstacle to its defaults
		if(++game.score%15==0){
			game.background.speed-=1;
			game.level+=1;	//increase the background speed after every increase of 15 in the game score
		};
		this.x = 0;
		this.y = 0;
		// this.speed = 0;
		this.alive = false;
	};
}
Obstacle.prototype=new Drawable();
KEY_CODES = {	//Declare few constants for key codes.
	32: 'space',
	38: 'up',
	37: 'left',
	39: 'right'
}
KEY_STATUS = {};	//A new object for knowing currently pressed keys
for (code in KEY_CODES){	//initialize the KEY_STATUS object
	KEY_STATUS[ KEY_CODES[ code ]]=false;
}
document.onkeydown = function(e) {	//make the status of key as true if it is pressed
	var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
	if (KEY_CODES[keyCode]){
		e.preventDefault();
		KEY_STATUS[KEY_CODES[keyCode]]=true;
	}
}
document.onkeyup = function(e) {	//make the status of a key as false if it is released
	var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
	if (KEY_CODES[keyCode]){
		e.preventDefault();
		KEY_STATUS[KEY_CODES[keyCode]]=false;
	}
}
var highScore=localStorage['highScore'] || 0;
function Game(){	//main function to manage the game
	this.init=function(){	//function to initialize the game
		this.level=1;
		this.score=0;	//keep track of score
		this.spaceUp=true;	//true if space is not pressed for pausing the game
		this.isPaused=false;	//true if game is paused
		this.lastObstaclePos=0;	//keep track of the position of last obstacle
		this.interObstacleDistance=700;	//initial inter obstacle distance
		this.scoreBoard = document.getElementById('score');	//get references to all html elements
		this.levelBoard=document.getElementById('level');
		this.messageBoard=document.getElementById('message');
		this.highScoreBoard = document.getElementById('highScore');
		this.bgCanvas = document.getElementById('background');
		this.obstacleCanvas = document.getElementById('obstacles');
		this.characterCanvas = document.getElementById('character');
		if(this.bgCanvas.getContext){	//if the canvas has loaded successfully, then proceed
			this.bgContext=this.bgCanvas.getContext('2d');	//get contexts of all the canvases
			this.obstacleContext = this.obstacleCanvas.getContext('2d');
			this.characterContext=this.characterCanvas.getContext('2d');
			Background.prototype.context=this.bgContext;	//initialize the variables for each type of object
			Background.prototype.canvasWidth=this.bgCanvas.width;
			Background.prototype.canvasHeight=this.bgCanvas.height;
			Character.prototype.context=this.characterContext;
			Character.prototype.canvasWidth=this.characterCanvas.width;
			Character.prototype.canvasHeight=this.characterCanvas.height;
			Obstacle.prototype.context=this.obstacleContext;
			Obstacle.prototype.canvasWidth=this.obstacleCanvas.width;
			Obstacle.prototype.canvasHeight=this.obstacleCanvas.height;
			this.messageBoard.innerHTML="Press Space to pause!!!";
			this.background=new Background();	//create a new background
			this.background.init(0, 0);	//initialize the background
			this.character=new Character();	//create a character
			this.obstaclePool=new Pool(4);	//create pool of obstacles such that at any time there are no more than 4 obstacles on the screen
			this.obstaclePool.init();	//initialize the obstacle Pool
			// var characterStartX = this.characterCanvas.width/2 - imageStore.character.width;
			var groundY = 100;	//ground level in the background
			var characterStartY = this.characterCanvas.height - groundY - imageStore.characters[characterId-1].height;
			this.character.init(0, characterStartY, imageStore.characters[characterId-1].width,
			               imageStore.characters[characterId-1].height);	//initialize the character
			return true;
		}
		else{
			return false;
		}
	};
	this.getObstacles = function(id){	//function to get new obstacles
		if(game.score==0 || !(game.score%15==0)){
			this.obstaclePool.get(this.obstacleCanvas.width, this.obstacleCanvas.height-imageStore.obstacles[id].height, id);
		}
	};
	this.start=function(){	//function to start the game
		this.highScoreBoard.innerHTML="High Score : "+highScore;
		this.character.draw();	//draw the character
		animate();	//start animating the game
	};
	this.updateScore=function(){	//function to update the scoreBoard and levelBoard
		this.scoreBoard.innerHTML="Score : "+this.score;
		this.levelBoard.innerHTML="Level : "+this.level;
		if(this.score>=highScore){
			highScore=this.score;
			localStorage['highScore']=highScore;
			this.highScoreBoard.innerHTML="High Score : "+highScore;
		}
	};
	this.togglePause=function(){	//function to check if game is to be Paused and do so if required and vice versa
		if(KEY_STATUS.space==true){
			if(this.spaceUp==true){
				if(this.isPaused=(!this.isPaused)){
					this.messageBoard.innerHTML="Press Space to continue!!!";
				}
				else{
					this.messageBoard.innerHTML="Press Space to pause!!!";	
				}
			}
			this.spaceUp=false;
		}
		else{
			this.spaceUp=true;
		}
		// if(KEY_STATUS.space==true){
		// 	game.init();
		// }
	};
	this.end=function(){	//function to end the current game
		for (var i = 0; i < this.obstaclePool.pool.length; i++) {
			this.obstaclePool.pool[i].remove();
			this.obstaclePool.pool[i].clear();	
		}
		this.character.remove();
	};
}
var game = new Game();	//create a new instance of the game
function isColliding(object1, object2){	//function to check if object1 is colliding with object2
	// if((object1.x+object1.width > object2.x) && (object1.x < object2.x+object2.width) && (object1.y+object1.height > object2.y) && (object1.y < object2.y+object2.height)){
	// 	return true;
	// }
	if((object1.x+object1.width/2)>object2.x && (object1.x+object1.width/2)<object2.x+object2.width && (object1.y+object1.height/2 > object2.y) && (object1.y+object1.height/2 < object2.y+object2.height)){
 		return true;
 	}
	else{
		return false;
	}
}
function restart(){
	game.end();
	game.init();
	if(isPlayOn==false){
		window.init();
	}
}
function checkCollision(){	//function to check if the character is colliding with any of the obstacles
	for (var i = 0; i < game.obstaclePool.pool.length; i++) {
		 if(game.obstaclePool.pool[i].alive){	//compare only with the obstacles that are alive to reduce no. of comparisons
			if(isColliding(game.character, game.obstaclePool.pool[i])){
				return true;
			}
		}
	};
	return false;
}
var isPlayOn=false;
var noOfFrames=0;	//keep track of the no. of frames already displayed
function animate(){
	if(!game.isPaused){	//continue if the game is not paused
		game.background.draw();	//draw the background
		game.character.move();	//animate the movement of character
		currentPos=noOfFrames*Math.abs(game.background.speed);	//total number of pixels covered by the background
		if(currentPos-game.lastObstaclePos>=game.interObstacleDistance){	//if enough distance has passed, put a new obstacle
			var random=Math.random();
			game.interObstacleDistance=Math.floor((random*400)+400);	//randomize the interObstacleDistance
			game.lastObstaclePos=currentPos;	
			var id = Math.floor((random * 4) + 0);	//randomize the obstacle itself
			game.getObstacles(id);
		}
		game.obstaclePool.animate();	//animate the alive obstacles
		game.updateScore();	//update the scoreboard
		noOfFrames++;
	}
	if(!checkCollision()){	//continue animating if there is no collision with obstacles
		game.togglePause();	//check and update the pause status of the game
		requestAnimFrame( animate );	//repeat the function for consistent 60fps
		isPlayOn=true;
	}
	else{
		isPlayOn=false;
		game.messageBoard.innerHTML="Game Over!!! Your Score : "+game.score;	//if collision has occured, end the game
	}
}

window.requestAnimFrame = (function(){
	return window.requestAnimationFrame || 
	window.webkitRequestAnimationFrame || 
	window.mozRequestAnimationFrame || 
	window.oRequestAnimationFrame || 
	window.msRequestAnimationFrame ||
	function(callback, element){
		window.setTimeout(callback, 1000/60);
	}
})();
function init(){	//initialize and start the game
	if(game.init()){
		game.start();
	}
}