document.addEventListener("DOMContentLoaded", ()=>{
    const arrow = document.querySelector(".arrow");
    const scrollContainer = document.querySelector(".col");
    if (!arrow || !scrollContainer) return;
    scrollContainer.addEventListener("scroll", ()=>{
        const scrollTop = scrollContainer.scrollTop;
        const containerHeight = scrollContainer.clientHeight;
        const contentHeight = scrollContainer.scrollHeight;
        // Si estamos al final (o a 50px del final)
        if (scrollTop + containerHeight >= contentHeight - 70) arrow.style.opacity = "0";
        else arrow.style.opacity = "1";
    });
});

//# sourceMappingURL=web.afc03007.js.map
