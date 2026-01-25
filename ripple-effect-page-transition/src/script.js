const DURATION_ANIMATION_CIRCLE = 2500;
const DURATION_ANIMATION_OPACITY = 1500;

const createExpandingCircle = ({ x, y, size }) => {
  const wrapper = document.createElement("div");
  wrapper.className = "page-transition-circle-wrapper";
  wrapper.style.setProperty(
    "--animation-duration-circle",
    `${DURATION_ANIMATION_CIRCLE}ms`
  );
  wrapper.style.setProperty(
    "--animation-duration-opacity",
    `${DURATION_ANIMATION_OPACITY}ms`
  );

  const circle = document.createElement("div");
  circle.className = "page-transition-circle";
  circle.style.left = `${x}px`;
  circle.style.top = `${y}px`;
  circle.style.width = `${size}px`;
  circle.style.height = `${size}px`;

  wrapper.appendChild(circle);
  document.body.appendChild(wrapper);

  setTimeout(() => {
    circle.style.opacity = "0";
  }, DURATION_ANIMATION_CIRCLE - DURATION_ANIMATION_OPACITY);

  setTimeout(() => {
    wrapper.remove();
  }, DURATION_ANIMATION_CIRCLE);
};

const createExpandingCircleOnMouseClick = (event) => {
  const x = event.clientX || 0;
  const y = event.clientY || 0;

  const size = Math.max(window.innerWidth, window.innerHeight) * 2;

  createExpandingCircle({ x, y, size });
};

document
  .querySelector("body")
  .addEventListener("click", createExpandingCircleOnMouseClick);

setTimeout(() => {
  createExpandingCircle({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    size: Math.max(window.innerWidth, window.innerHeight) * 2
  });
}, 1000);
