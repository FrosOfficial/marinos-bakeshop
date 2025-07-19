//For Cake Products
document.addEventListener("DOMContentLoaded", function () {
    
    document.getElementById("cakesLink").addEventListener("click", function (event) {
        event.preventDefault();

        const YemaCakeSpecial = document.getElementById('YemaCakeSpecial');
        YemaCakeSpecial.classList.toggle('hidden');

       const YemaCakeTub = document.getElementById('YemaCakeTub');
       YemaCakeTub.classList.toggle('hidden');

       const ChiffonCake = document.getElementById('ChiffonCake');
       ChiffonCake.classList.toggle('hidden');

       const CustardCake = document.getElementById('CustardCake');
       CustardCake.classList.toggle('hidden');

    });
});

//For Cookies Products
document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("cookiesLink").addEventListener("click", function (event) {
        event.preventDefault();

        const CrinklesInBoxed = document.getElementById('CrinklesInBoxed');
        CrinklesInBoxed.classList.toggle('hidden');

       const CrinklesInPlastic = document.getElementById('CrinklesInPlastic');
       CrinklesInPlastic.classList.toggle('hidden');

       const ChocoChipsCookiesInBoxed = document.getElementById('ChocoChipsCookiesInBoxed');
       ChocoChipsCookiesInBoxed.classList.toggle('hidden');

       const ChocoChipsCookiesInPlastic = document.getElementById('ChocoChipsCookiesInPlastic');
       ChocoChipsCookiesInPlastic.classList.toggle('hidden');
  
    });
});

//For Sweets Products
document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("sweetsLink").addEventListener("click", function (event) {
        event.preventDefault();

        const caramelBarBox = document.getElementById('caramelBarBox');
        caramelBarBox.classList.toggle('hidden');

        const EggPie = document.getElementById('EggPie');
        EggPie.classList.toggle('hidden');
      
    });
});


//For Toggleing The Title For Cakes, Cookies and Sweets 
const cakesLink = document.getElementById('cakesLink');
const cookiesLink = document.getElementById('cookiesLink');
const sweetsLink = document.getElementById('sweetsLink');

const productsTitle = document.querySelector('.products .title span');
const selectedItems = [];

cakesLink.addEventListener('click', function() {
    toggleSelectedItem('Our Cakes');
});

cookiesLink.addEventListener('click', function() {
    toggleSelectedItem('Our Cookies');
});

sweetsLink.addEventListener('click', function() {
    toggleSelectedItem('Our Sweets');
});

function toggleSelectedItem(item) {
    const index = selectedItems.indexOf(item);
    if (index !== -1) {
        selectedItems.splice(index, 1);
    } else {
        selectedItems.push(item);
    }

    if (selectedItems.length === 3) {
            productsTitle.innerText = 'All products';
    } else {
        productsTitle.innerText = selectedItems.join(' & ');
    }
}

//For Toggleing Cakes, Cookies and sweets using shop button on home
document.addEventListener("DOMContentLoaded", function () {
    
    var shopNowButtons = document.querySelectorAll(".shopNowButton");
    var cakesLink = document.getElementById("cakesLink");
    var cookiesLink = document.getElementById("cookiesLink");
    var sweetsLink = document.getElementById("sweetsLink");

    function toggleClick(link) {
        link.click(); 
        link.scrollIntoView({ behavior: 'smooth' }); 
    }
    
    shopNowButtons.forEach(function (button, index) {
        button.addEventListener("click", function () {
            switch (index) {
                case 0:
                    toggleClick(cakesLink);
                    break;
                case 1:
                    toggleClick(cookiesLink);
                    break;
                case 2:
                    toggleClick(sweetsLink);
                    break;
            }
        });
    });
});