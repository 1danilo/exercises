/*
//Object Literals
const circle = {
  radius: 1, // radius is a property(also a "key"), properties hold VALUE (1 is the "value")
  location: {
    x: 1,
    y: 1,
  },
  draw: function () {
    //draw is a method, functions and methods are used to define LOGIC
    console.log("draw");
  },
};

circle.draw();



//Factory or Construction Function
// If an object has one or more methods, the object has BEHAVIOR
//Imagine we would like to create another circle:

function createCircle(radius) {
  return {
    radius,
    draw: function () {
      console.log("draw");
    },
  };
}
const circle = createCircle(1);
circle.draw();

//Constructor Function
function Circle(radius) {
  console.log("this", this);
  this.radius = radius;
  this.draw = function () {
    console.log("draw");
  };
}

const another = new Circle(1);



const message = "Don't be sad, be happy!";
let withSlice = message.slice(0, 3);
console.log(withSlice);
*/


