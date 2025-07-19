let navbar = document.querySelector('.navbar');

document.querySelector('#menu-btn').onclick = () => {
    navbar.classList.toggle('active');
}

window.onscroll = () => {
    navbar.classList.remove('active');
}

let slides = document.querySelectorAll('.home .slides-container .slide');
let index = 0;

function next(){
    slides[index].classList.remove('active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('active');
}

function prev(){
    slides[index].classList.remove('active');
    index = (index - 1 + slides.length) % slides.length;
    slides[index].classList.add('active');
}

//For Contacts
function validateForm() {
    var name = document.getElementById('name').value.trim();
    var email = document.getElementById('email').value.trim();
    var number = document.getElementById('number').value.trim();
    var subject = document.getElementById('subject').value.trim();
    var message = document.getElementById('message').value.trim();

    if (name === '' || email === '' || number === '' || subject === '' || message === '') {
        alert('Please fill out all fields');
        return false;
    }

    if (!/^\d+$/.test(number)) {
        alert('Please enter a valid number in the "Number" field');
        return false;
    }

    return true;
}

//To go to other HTML Sites
document.getElementById('cart-btn').addEventListener('click', function() {
    window.location.href = 'Cart.html';
});

document.getElementById('login-btn').addEventListener('click', function() {
    window.location.href = 'Login.html';
});


//Image zooming for the Eye button
function zoomImage(imageSource) {
    var zoomedImage = document.getElementById('zoomedImage');
    zoomedImage.src = imageSource;
    
    previousScrollPosition = window.scrollY;

    var zoomedImageContainer = document.querySelector('.zoomedImageContainer');
    zoomedImageContainer.style.display = 'flex';

    document.addEventListener('wheel', preventScrolling, { passive: false });
}
function hideZoomedImage(event) {
    var zoomedImageContainer = document.querySelector('.zoomedImageContainer');
    zoomedImageContainer.style.display = 'none';

    document.removeEventListener('wheel', preventScrolling);

    setTimeout(function() {
        window.scrollTo(0, previousScrollPosition);
    }, 0);

    return false;
}

function preventScrolling(event) {
    event.preventDefault();
}








    



    
   

