document.addEventListener('DOMContentLoaded', function() {
    let tagDefinitions = {};
    let currentPath = [];
    let isAdmin = false;
    let uploadedFiles = []; // Store uploaded files
    let currentRooms = [];
    const activeTagFilters = new Set();

    const districtDisplay = {
        'tan-binh': 'Tân Bình',
        'tan-phu': 'Tân Phú'
    };

    const districtCode = {
        'tan-binh': 'TB',
        'tan-phu': 'TP'
    };

    const wardDisplay = {
        'phuong-1': 'Phường 1',
        'phuong-2': 'Phường 2',
        'phuong-3': 'Phường 3',
        'phuong-4': 'Phường 4',
        'phuong-5': 'Phường 5',
        'phuong-6': 'Phường 6',
        'phuong-7': 'Phường 7',
        'phuong-8': 'Phường 8',
        'phuong-9': 'Phường 9',
        'phuong-10': 'Phường 10',
        'phuong-11': 'Phường 11',
        'phuong-12': 'Phường 12',
        'phuong-13': 'Phường 13',
        'phuong-14': 'Phường 14',   
        'phuong-15': 'Phường 15'
    };

    const wardCode = {
        'phuong-1': 'P1',
        'phuong-2': 'P2',
        'phuong-3': 'P3',
        'phuong-4': 'P4',
        'phuong-5': 'P5',
        'phuong-6': 'P6',
        'phuong-7': 'P7',
        'phuong-8': 'P8',
        'phuong-9': 'P9',
        'phuong-10': 'P10',
        'phuong-11': 'P11',
        'phuong-12': 'P12',
        'phuong-13': 'P13',
        'phuong-14': 'P14',
        'phuong-15': 'P15'
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

        // Logo click to go home
        document.querySelector('.logo').addEventListener('click', () => {
            window.location.hash = '';
        });

        // Price buttons
        document.querySelectorAll('#price-section .panel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const price = btn.dataset.price;
                setPath(['district', price]);
            });
        });

        // Admin toggle
        document.getElementById('admin-toggle').addEventListener('click', toggleAdmin);

        // Add room button
        document.getElementById('add-room-btn').addEventListener('click', showAddRoomModal);
        document.getElementById('add-room-main-btn').addEventListener('click', showAddRoomModal);
        
        // Setup file drag-drop once
        setupFileDragDrop();
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
        fetch(`/districts?priceRange=${priceRange}&t=${Date.now()}`)
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
        fetch(`/wards?district=${encodeURIComponent(district)}&priceRange=${priceRange}&t=${Date.now()}`)
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
        fetch(`/rooms?district=${encodeURIComponent(district)}&ward=${encodeURIComponent(ward)}&priceRange=${priceRange}&t=${Date.now()}`)
            .then(response => response.json())
            .then(rooms => {
                currentRooms = rooms;
                activeTagFilters.clear();
                renderTagFilter();
                renderRoomList();
            });
    }

    function renderRoomList() {
        const container = document.getElementById('room-list');
        container.innerHTML = '';

        let roomsToRender = currentRooms;
        if (activeTagFilters.size > 0) {
            roomsToRender = currentRooms.filter(room => {
                if (!room.tags) return false;
                return Array.from(activeTagFilters).every(tagKey => room.tags[tagKey]);
            });
        }

        roomsToRender.forEach(room => {
            const card = createRoomCard(room);
            container.appendChild(card);
        });
    }

    function renderTagFilter() {
        const wrapper = document.getElementById('tag-filter-wrapper');
        const filterBox = document.getElementById('tag-filter');
        if (!wrapper || !filterBox) return;

        filterBox.innerHTML = '';
        Object.entries(tagDefinitions).forEach(([key, def]) => {
            const btn = document.createElement('button');
            btn.className = 'tag-filter-btn';
            btn.textContent = def.label;
            if (activeTagFilters.has(key)) btn.classList.add('active');
            btn.addEventListener('click', () => {
                if (activeTagFilters.has(key)) {
                    activeTagFilters.delete(key);
                } else {
                    activeTagFilters.add(key);
                }
                renderTagFilter();
                renderRoomList();
            });
            filterBox.appendChild(btn);
        });

        wrapper.classList.remove('hidden');
    }

    function changeImage(carousel, direction) {
        const images = carousel.querySelectorAll('img');
        const currentImage = carousel.querySelector('img.active');
        const currentIndex = Array.from(images).indexOf(currentImage);
        let nextIndex = (currentIndex + direction + images.length) % images.length;
        
        images.forEach(img => img.classList.remove('active'));
        images[nextIndex].classList.add('active');
    }

    function createRoomCard(room) {
        const card = document.createElement('div');
        card.className = 'room-card';
        card.addEventListener('click', () => showRoomModal(room));

        if (room.tags && room.tags.IsHotDeal) {
            card.classList.add('hot-deal');
            const badge = document.createElement('div');
            badge.className = 'hot-deal-badge';
            badge.textContent = 'Hot deal';
            card.appendChild(badge);
        }

        // Add delete button if admin
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Xóa';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteRoom(room.roomId);
            });
            card.appendChild(deleteBtn);
        }

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
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                clearInterval(autoRotateInterval);
                changeImage(carousel, -1);
                startAutoRotate();
            });

            const nextBtn = document.createElement('button');
            nextBtn.className = 'carousel-btn next-btn';
            nextBtn.textContent = '›';
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                clearInterval(autoRotateInterval);
                changeImage(carousel, 1);
                startAutoRotate();
            });

            carousel.appendChild(prevBtn);
            carousel.appendChild(nextBtn);

            // Auto-rotate images every 3 seconds
            let autoRotateInterval;
            const startAutoRotate = () => {
                autoRotateInterval = setInterval(() => {
                    changeImage(carousel, 1);
                }, 3000);
            };

            // Pause on hover
            carousel.addEventListener('mouseenter', () => {
                clearInterval(autoRotateInterval);
            });
            carousel.addEventListener('mouseleave', () => {
                startAutoRotate();
            });

            startAutoRotate();
        }

        const info = document.createElement('div');
        info.className = 'room-info';

        // Show price for everyone
        const price = document.createElement('div');
        price.className = 'room-price';
        price.textContent = `${room.price.toLocaleString()} VND`;
        info.appendChild(price);

        const roomId = document.createElement('div');
        roomId.className = 'room-id';
        roomId.textContent = `Mã phòng: ${room.roomId}`;

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

        info.appendChild(roomId);
        info.appendChild(tagsDiv);

        card.appendChild(carousel);
        card.appendChild(info);

        return card;
    }

    function toggleAdmin() {
        if (!isAdmin) {
            const key = prompt('Nhập key admin:');
            if (key !== 'deptraiprovjp') {
                alert('Key sai!');
                return;
            }
        }
        isAdmin = !isAdmin;
        const btn = document.getElementById('admin-toggle');
        btn.textContent = isAdmin ? 'Exit Admin' : 'Admin';
        btn.style.background = isAdmin ? '#ff4444' : '#ff69b4';
        document.getElementById('admin-controls').style.display = isAdmin ? 'block' : 'none';
        document.getElementById('admin-main-controls').style.display = isAdmin ? 'block' : 'none';
        // Reload current view to show/hide admin elements
        updateFromHash();
    }

    function showAddRoomModal() {
        const modal = document.getElementById('add-room-modal');
        const form = document.getElementById('add-room-form');
        form.dataset.mode = 'add';
        form.dataset.roomId = '';
        
        document.querySelector('#add-room-modal h2').textContent = 'Thêm phòng mới';
        document.querySelector('#add-room-form button[type="submit"]').textContent = 'Thêm phòng';
        
        // Clear form
        form.reset();
        uploadedFiles = [];
        document.getElementById('file-list').innerHTML = '';
        
        // Populate districts
        const districtSelect = document.getElementById('district-select');
        districtSelect.innerHTML = '';
        Object.keys(districtDisplay).forEach(d => {
            const option = document.createElement('option');
            option.value = d;
            option.textContent = districtDisplay[d];
            districtSelect.appendChild(option);
        });
        // Populate wards
        const wardSelect = document.getElementById('ward-select');
        wardSelect.innerHTML = '';
        Object.keys(wardDisplay).forEach(w => {
            const option = document.createElement('option');
            option.value = w;
            option.textContent = wardDisplay[w];
            wardSelect.appendChild(option);
        });
        // Populate tags
        const tagsContainer = document.getElementById('tags-checkboxes');
        tagsContainer.innerHTML = '';
        Object.keys(tagDefinitions).forEach(key => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = key;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(tagDefinitions[key].label));
            tagsContainer.appendChild(label);
        });
        
        modal.style.display = 'block';
    }

    function setupFileDragDrop() {
        const dropZone = document.getElementById('drop-zone');
        const imageInput = document.getElementById('image-input');

        if (!dropZone || !imageInput) {
            console.error('Drop zone or image input not found!');
            return;
        }

        if (dropZone.dataset.bound === 'true' && imageInput.dataset.bound === 'true') {
            return;
        }

        dropZone.dataset.bound = 'true';
        imageInput.dataset.bound = 'true';

        dropZone.addEventListener('click', () => {
            imageInput.click();
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });

        imageInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
            // Clear input so user can select same file again
            e.target.value = '';
        });
    }

    function handleFiles(files) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        Array.from(files).forEach(file => {
            if (validTypes.includes(file.type)) {
                uploadedFiles.push(file);
                displayFilePreview(file);
            } else {
                alert(`File ${file.name} không phải định dạng ảnh hợp lệ (jpg, png, gif, webp)`);
            }
        });
    }

    function displayFilePreview(file) {
        const fileList = document.getElementById('file-list');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            fileItem.appendChild(img);
        };
        reader.readAsDataURL(file);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-item-remove';
        removeBtn.textContent = '×';
        removeBtn.type = 'button';
        removeBtn.addEventListener('click', () => {
            const index = uploadedFiles.indexOf(file);
            uploadedFiles.splice(index, 1);
            fileItem.remove();
        });
        fileItem.appendChild(removeBtn);

        fileList.appendChild(fileItem);
    }

    // Format price input with thousand separators
    function formatPriceInput(input) {
        // Get cursor position
        const cursorPos = input.selectionStart;
        const oldValue = input.value;
        const oldLength = oldValue.length;
        
        // Remove non-digits
        let value = input.value.replace(/\D/g, '');
        if (value === '') {
            input.value = '';
            return;
        }
        
        // Add dots every 3 digits from right
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        input.value = value;
        
        // Restore cursor position
        const newLength = value.length;
        const diff = newLength - oldLength;
        input.setSelectionRange(cursorPos + diff, cursorPos + diff);
    }

    // Setup price input formatting
    const priceInput = document.getElementById('price');
    if (priceInput) {
        priceInput.addEventListener('input', function() {
            formatPriceInput(this);
        });
    }

    function deleteRoom(roomId) {
        if (confirm('Bạn có chắc muốn xóa phòng này?')) {
            fetch(`/rooms/${roomId}`, { method: 'DELETE' })
                .then(() => {
                    alert('Đã xóa phòng');
                    updateFromHash(); // Reload list
                });
        }
    }

    function showRoomModal(room) {
        const modal = document.getElementById('room-modal');
        const modalCarousel = document.getElementById('modal-carousel');
        const modalInfo = document.getElementById('modal-info');

        // Populate carousel
        modalCarousel.innerHTML = '';
        room.images.forEach((img, index) => {
            const imgEl = document.createElement('img');
            imgEl.src = img;
            imgEl.alt = 'Room image';
            if (index === 0) imgEl.classList.add('active');
            modalCarousel.appendChild(imgEl);
        });

        if (room.images.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'carousel-btn prev-btn';
            prevBtn.textContent = '‹';
            prevBtn.addEventListener('click', () => changeImage(modalCarousel, -1));

            const nextBtn = document.createElement('button');
            nextBtn.className = 'carousel-btn next-btn';
            nextBtn.textContent = '›';
            nextBtn.addEventListener('click', () => changeImage(modalCarousel, 1));

            modalCarousel.appendChild(prevBtn);
            modalCarousel.appendChild(nextBtn);
        }

        // Populate info
        modalInfo.innerHTML = `
            <h3>Mã phòng: ${room.roomId}</h3>
            ${isAdmin ? `<p><strong>Giá:</strong> ${room.price.toLocaleString()} VND</p>` : ''}
            <p><strong>Quận:</strong> ${districtDisplay[room.district] || room.district}</p>
            <p><strong>Phường:</strong> ${wardDisplay[room.ward] || room.ward}</p>
            ${isAdmin && room.note ? `<p><strong>Note:</strong> ${room.note}</p>` : ''}
            <div class="modal-tags">
                ${Object.entries(room.tags).filter(([key, value]) => value && tagDefinitions[key]).map(([key]) => 
                    `<span class="tag">${tagDefinitions[key].label}</span>`
                ).join('')}
            </div>
        `;

        modal.style.display = 'block';
    }

    // Close modal
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('room-modal').style.display = 'none';
        document.getElementById('add-room-modal').style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        const roomModal = document.getElementById('room-modal');
        const addModal = document.getElementById('add-room-modal');
        if (event.target === roomModal) {
            roomModal.style.display = 'none';
        }
        if (event.target === addModal) {
            addModal.style.display = 'none';
        }
    });

    // Add room form
    document.getElementById('add-room-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validate price
        const priceValue = document.getElementById('price').value.replace(/\./g, '');
        const priceNum = parseInt(priceValue);
        if (isNaN(priceNum) || priceNum < 1000000 || priceNum > 100000000) {
            alert('Giá phải từ 1.000.000 đến 100.000.000 VNĐ');
            return;
        }
        
        const formData = new FormData();
        const tags = {};
        document.querySelectorAll('#tags-checkboxes input:checked').forEach(cb => {
            tags[cb.value] = true;
        });

        // Generate folder name
        const district = document.getElementById('district-select').value;
        const ward = document.getElementById('ward-select').value;
        const streetName = document.getElementById('street-name').value;
        const roomId = document.getElementById('room-id').value;
        
        const distCode = districtCode[district] || '';
        const wardCode_val = wardCode[ward] || '';
        const streetCode = generateStreetCode(streetName);
        const folderName = roomId 
            ? `${distCode}_${wardCode_val}_${streetCode}_${roomId}` 
            : `${distCode}_${wardCode_val}_${streetCode}`;

        const newRoomId = folderName;
        formData.append('roomId', newRoomId);
        formData.append('district', district);
        formData.append('districtLabel', districtDisplay[district]);
        formData.append('ward', ward);
        formData.append('wardLabel', wardDisplay[ward]);
        formData.append('price', priceNum);
        formData.append('tags', JSON.stringify(tags));
        formData.append('note', document.getElementById('note').value);
        formData.append('folderName', folderName);

        // Append files
        if (uploadedFiles.length > 0) {
            uploadedFiles.forEach((file, index) => {
                formData.append('images', file, `${index + 1}.${getFileExtension(file.name)}`);
            });
        }

        if (uploadedFiles.length === 0) {
            alert('Vui lòng chọn ít nhất 1 ảnh');
            return;
        }

        fetch('/rooms', {
            method: 'POST',
            body: formData
        })
        .then(async (res) => {
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload.error || 'Upload failed');
            }
            alert('Đã thêm phòng');
            document.getElementById('add-room-modal').style.display = 'none';
            uploadedFiles = [];
            updateFromHash(); // Reload list
        })
        .catch(err => alert('Lỗi: ' + err.message));
    });

    // Helper function to remove Vietnamese accents
    function removeVietnameseAccents(str) {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    }

    // Helper function to generate street code
    function generateStreetCode(streetName) {
        return removeVietnameseAccents(streetName)
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 10); // Limit to 10 chars
    }

    // Helper function to get file extension
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }
});