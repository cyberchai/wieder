var sky = document.getElementById("sky");

sky.width = document.body.clientWidth;
sky.height = document.body.clientHeight;

if (sky.getContext){
    var skyContext = sky.getContext("2d");

    var radius = 2;

    for(var star = 0; star < 240; star++){ 
        var min = ( Math.random() * 30 ) / 10;
        var max = sky.width - radius;

        var centerX = Math.floor(Math.random() * (max - min + 1)) + min;
        var centerY = Math.floor(Math.random() * (max - min + 1)) + min;

        skyContext.beginPath();
        skyContext.arc(centerX, centerY, min, 0, 2 * Math.PI);

        console.log(min);
        var opacity = Math.random();
      
        skyContext.fillStyle = "rgba(255, 255, 255, " + opacity + ")";
        skyContext.fill();
    }
}
