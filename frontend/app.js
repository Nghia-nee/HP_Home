document.addEventListener('DOMContentLoaded', function() {
    let tagDefinitions = {};
    let currentPath = [];

    const districtDisplay = {
        'tan-binh': 'Tân Bình',
        'tan-phu': 'Tân Phú'
    };

    const wardDisplay = {
        'phuong-1': 'Phường 1',
        'phuong-3': 'Phường 3',
        'phuong-5': 'Phường 5'
    };

    // Load tag definitions
    fetch('/tags')
        .then(response => response.json())
        .then(tags => {
            tagDefinitions = tags;
            init();
        });

    function init() {
        updateFromHash();
        window.addEventListener('hashchange', updateFromHash);

        // Price buttons
        document.querySelectorAll('#price-section .panel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const price = btn.dataset.price;
                setPath(['district', price]);
            });
        });
    }

    function updateFromHash() {
        const hash = window.location.hash.substring(1);
        currentPath = hash ? hash.split('/').filter(p => p).map(decodeURIComponent) : [];
        render();
    }

    function setPath(path) {
        window.location.hash = path.map(encodeURIComponent).join('/');
    }

    function render() {
        const [step, ...params] = currentPath;

        // Hide all sections
        document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));

        if (!step || step === 'price') {
            document.getElementById('price-section').classList.remove('hidden');
        } else if (step === 'district') {
            const priceRange = params[0];
            if (params.length === 1) {
                document.getElementById('district-section').classList.remove('hidden');
                loadDistricts(priceRange);
            } else if (params.length === 2) {
                const district = params[1];
                document.getElementById('ward-section').classList.remove('hidden');
                loadWards(priceRange, district);
            }
        } else if (step === 'rooms') {
            const priceRange = params[0];
            const district = params[1];
            const ward = params[2];
            document.getElementById('rooms-section').classList.remove('hidden');
            loadRooms(priceRange, district, ward);
        }
    }

    function loadDistricts(priceRange) {
        fetch(`/districts?priceRange=${priceRange}`)
            .then(response => response.json())
            .then(districts => {
                const container = document.getElementById('district-buttons');
                container.innerHTML = '';
                districts.forEach(d => {
                    const btn = document.createElement('button');
                    btn.className = 'panel-btn';
                    btn.textContent = districtDisplay[d.name] || d.name;
                    btn.addEventListener('click', () => {
                        setPath(['district', priceRange, d.name]);
                    });
                    container.appendChild(btn);
                });
            });
    }

    function loadWards(priceRange, district) {
        fetch(`/wards?district=${encodeURIComponent(district)}&priceRange=${priceRange}`)
            .then(response => response.json())
            .then(wards => {
                const container = document.getElementById('ward-buttons');
                container.innerHTML = '';
                wards.forEach(w => {
                    const btn = document.createElement('button');
                    btn.className = 'panel-btn';
                    btn.textContent = wardDisplay[w.name] || w.name;
                    btn.addEventListener('click', () => {
                        setPath(['rooms', priceRange, district, w.name]);
                    });
                    container.appendChild(btn);
                });
            });
    }

    function loadRooms(priceRange, district, ward) {
        fetch(`/rooms?district=${encodeURIComponent(district)}&ward=${encodeURIComponent(ward)}&priceRange=${priceRange}`)
            .then(response => response.json())
            .then(rooms => {
                const container = document.getElementById('room-list');
                container.innerHTML = '';
                rooms.forEach(room => {
                    const card = createRoomCard(room);
                    container.appendChild(card);
                });
            });
    }

    function createRoomCard(room) {
        const card = document.createElement('div');
        card.className = 'room-card';

        const carousel = document.createElement('div');
        carousel.className = 'carousel';

        room.images.forEach((img, index) => {
            const imgEl = document.createElement('img');
            imgEl.src = img;
            imgEl.alt = 'Room image';
            if (index === 0) imgEl.classList.add('active');
            carousel.appendChild(imgEl);
        });

        if (room.images.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'carousel-btn prev-btn';
            prevBtn.textContent = '‹';
            prevBtn.addEventListener('click', () => changeImage(carousel, -1));

            const nextBtn = document.createElement('button');
            nextBtn.className = 'carousel-btn next-btn';
            nextBtn.textContent = '›';
            nextBtn.addEventListener('click', () => changeImage(carousel, 1));

            carousel.appendChild(prevBtn);
            carousel.appendChild(nextBtn);
        }

        const info = document.createElement('div');
        info.className = 'room-info';

        const price = document.createElement('div');
        price.className = 'room-price';
        price.textContent = `${room.price.toLocaleString()} VND`;

        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'tags';

        Object.entries(room.tags).forEach(([key, value]) => {
            if (value && tagDefinitions[key]) {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = tagDefinitions[key].label;
                tagsDiv.appendChild(tag);
            }
        });

        info.appendChild(price);
        info.appendChild(tagsDiv);

        card.appendChild(carousel);
        card.appendChild(info);

        return card;
    }

    function changeImage(carousel, direction) {
        const images = carousel.querySelectorAll('img');
        let activeIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
        images[activeIndex].classList.remove('active');
        activeIndex = (activeIndex + direction + images.length) % images.length;
        images[activeIndex].classList.add('active');
    }
});