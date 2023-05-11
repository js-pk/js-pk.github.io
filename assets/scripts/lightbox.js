// originally from https://jekyllcodex.org/without-plugin/lightbox/
// add keyboard and swipe event and prevent scrolling when lightbox is setted.

function is_youtubelink(url) {
    var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    return (url.match(p)) ? RegExp.$1 : false;
}

function is_imagelink(url) {
    var p = /([a-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif))/i;
    return (url.match(p)) ? true : false;
}

function is_vimeolink(url,el) {
    var id = false;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
                var response = JSON.parse(xmlhttp.responseText);
                id = response.video_id;
                console.log(id);
                el.classList.add('lightbox-vimeo');
                el.setAttribute('data-id',id);

                el.addEventListener("click", function(event) {
                    event.preventDefault();
                    document.getElementById('lightbox').innerHTML = '<a id="close"></a><a id="next">&rsaquo;</a><a id="prev">&lsaquo;</a><div class="videoWrapperContainer"><div class="videoWrapper"><iframe src="https://player.vimeo.com/video/'+el.getAttribute('data-id')+'/?autoplay=1&byline=0&title=0&portrait=0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div></div>';
                    document.getElementById('lightbox').style.display = 'block';

                    setGallery(this);
                });
            }
            else if (xmlhttp.status == 400) {
                alert('There was an error 400');
            }
            else {
                alert('something else other than 200 was returned');
            }
        }
    };
    xmlhttp.open("GET", 'https://vimeo.com/api/oembed.json?url='+url, true);
    xmlhttp.send();
}

function closeGallary() {
  this.innerHTML = '';
  document.getElementById('lightbox').style.display = 'none';
  
  //set window scrollable
  document.body.style.position = 'static'
  document.body.style.top = '0'
  window.scrollTo(0, this.windowScrollY)
}

function setGallery(el) {
  //set window fixed
  this.windowScrollY = window.scrollY
  document.body.style.position = 'fixed'
  document.body.style.top = `-${this.windowScrollY}px`
  
    var elements = document.body.querySelectorAll(".gallery");
    elements.forEach(element => {
        element.classList.remove('gallery');
  });
  if(el.closest('ul, p')) {
    var link_elements = el.closest('ul, p').querySelectorAll("a[class*='lightbox-']");
    link_elements.forEach(link_element => {
      link_element.classList.remove('current');
    });
    link_elements.forEach(link_element => {
      if(el.getAttribute('href') == link_element.getAttribute('href')) {
        link_element.classList.add('current');
      }
    });
    if(link_elements.length>1) {
      document.getElementById('lightbox').classList.add('gallery');
      link_elements.forEach(link_element => {
        link_element.classList.add('gallery');
      });
    }
    var currentkey;
    var gallery_elements = document.querySelectorAll('a.gallery');
    Object.keys(gallery_elements).forEach(function (k) {
      if(gallery_elements[k].classList.contains('current')) currentkey = k;
    });
    if(currentkey==(gallery_elements.length-1)) var nextkey = 0;
    else var nextkey = parseInt(currentkey)+1;
    if(currentkey==0) var prevkey = parseInt(gallery_elements.length-1);
    else var prevkey = parseInt(currentkey)-1;
    
    var swipables = new SwipeIt('.box')
    swipables
    .on('swipeLeft', function(e) {
      gallery_elements[prevkey].click();
    })
    .on('swipeRight', function(e) {
      gallery_elements[nextkey].click();
    })
    .on('swipeDown', function(e) {
      closeGallary();
    })
    window.addEventListener('keydown', function(e) {
      if (e.key == 'ArrowLeft') {
        gallery_elements[prevkey].click();
      } else if (e.key == 'ArrowRight') {
        gallery_elements[nextkey].click();
      } else if (e.key == 'Escape') {
        closeGallary();
      }
    })
    document.getElementById('next').addEventListener("click", function() {
      gallery_elements[nextkey].click();
    });
    document.getElementById('prev').addEventListener("click", function() {
      gallery_elements[prevkey].click();
    });
  }
}

document.addEventListener("DOMContentLoaded", function() {

    //create lightbox div in the footer
    var newdiv = document.createElement("div");
    newdiv.setAttribute('id',"lightbox");
    document.body.appendChild(newdiv);

    //add classes to links to be able to initiate lightboxes
    var elements = document.querySelectorAll('a');
    elements.forEach(element => {
        var url = element.getAttribute('href');
        if(url) {
            if(url.indexOf('vimeo') !== -1 && !element.classList.contains('no-lightbox')) {
                is_vimeolink(url,element);
            }
            if(is_youtubelink(url) && !element.classList.contains('no-lightbox')) {
                element.classList.add('lightbox-youtube');
                element.setAttribute('data-id',is_youtubelink(url));
            }
            if(is_imagelink(url) && !element.classList.contains('no-lightbox')) {
                element.classList.add('lightbox-image');
                var href = element.getAttribute('href');
                var filename = href.split('/').pop();
                var split = filename.split(".");
                var name = split[0];
                element.setAttribute('title',name);
            }
        }
    });

    //remove the clicked lightbox
    document.getElementById('lightbox').addEventListener("click", function(event) {
        if(event.target.id != 'next' && event.target.id != 'prev'){
            closeGallary();
        }
    });
    
    //add the youtube lightbox on click
    var elements = document.querySelectorAll('a.lightbox-youtube');
    elements.forEach(element => {
        element.addEventListener("click", function(event) {
            event.preventDefault();
            document.getElementById('lightbox').innerHTML = '<a id="close"></a><a id="next">&rsaquo;</a><a id="prev">&lsaquo;</a><div class="videoWrapperContainer box"><div class="videoWrapper"><iframe src="https://www.youtube.com/embed/'+this.getAttribute('data-id')+'?autoplay=1&showinfo=0&rel=0"></iframe></div>';
            document.getElementById('lightbox').style.display = 'block';

            setGallery(this);
        });
    });

    //add the image lightbox on click
    var elements = document.querySelectorAll('a.lightbox-image');
    elements.forEach(element => {
        element.addEventListener("click", function(event) {
            event.preventDefault();
            document.getElementById('lightbox').innerHTML = '<a id="close"></a><a id="next">&rsaquo;</a><a id="prev">&lsaquo;</a><div class="img box" style="background: url(\''+this.getAttribute('href')+'\') center center / contain no-repeat;" title="'+this.getAttribute('title')+'" ><img src="'+this.getAttribute('href')+'" alt="'+this.getAttribute('title')+'" /></div><span>'+this.getAttribute('title')+'</span>';
            document.getElementById('lightbox').style.display = 'block';

            setGallery(this);
        });
    });

});