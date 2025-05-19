document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyButton = document.getElementById('saveApiKey');
    const flowerImageInput = document.getElementById('flowerImageInput');
    const uploadButton = document.getElementById('uploadButton');
    const identifyFlowerButton = document.getElementById('identifyFlowerButton');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageButton = document.getElementById('removeImageButton');
    const identificationResult = document.getElementById('identificationResult');
    const chatInput = document.getElementById('chatInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const chatBox = document.getElementById('chatBox');
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const takePictureButton = document.getElementById('takePictureButton');
    const cameraPreview = document.getElementById('cameraPreview');
    const cameraContainer = document.querySelector('.camera-container');
    const capturePictureButton = document.getElementById('capturePictureButton');
    const cancelCameraButton = document.getElementById('cancelCameraButton');
    const chatToggleButton = document.getElementById('chatToggleButton');
    const floatingChat = document.getElementById('floatingChat');
    
    // Camera stream reference
    let mediaStream = null;
    
    // Tab functionality
    const tabItems = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabItems.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Constants
    const SHAPES_API_BASE_URL = 'https://api.shapes.inc/v1';
    const FLORA_MODEL_ID = 'shapesinc/flora-lqcv';
    
    // State management
    let shapesApiKey = localStorage.getItem('shapesApiKey');
    let flowerCollection = JSON.parse(localStorage.getItem('flowerCollection')) || [];
    
    // Initialize
    if (shapesApiKey) {
        apiKeyInput.value = shapesApiKey;
    }
    
    // Initialize variables for search and sort
    const collectionSearch = document.getElementById('collectionSearch');
    const sortBy = document.getElementById('sortBy');
    let currentSearchTerm = '';
    let currentSortOption = 'date-desc';

    // Add event listeners for search and sort
    collectionSearch?.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase();
        displayFlowerCollection();
    });

    sortBy?.addEventListener('change', (e) => {
        currentSortOption = e.target.value;
        displayFlowerCollection();
    });

    // Display flower collection if it exists
    function displayFlowerCollection() {
        const collectionContainer = document.getElementById('flowerCollectionContainer');
        collectionContainer.innerHTML = '';
        
        if (flowerCollection.length === 0) {
            collectionContainer.innerHTML = '<p>Your collection is empty. Identify flowers to add them!</p>';
            return;
        }

        // Filter flowers based on search term
        let filteredCollection = flowerCollection;
        if (currentSearchTerm) {
            filteredCollection = flowerCollection.filter(flower => {
                const searchableText = `${flower.name} ${flower.details.species}`.toLowerCase();
                return searchableText.includes(currentSearchTerm);
            });
        }

        // Sort flowers based on selected option
        filteredCollection.sort((a, b) => {
            switch (currentSortOption) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'name-asc':
                    return (a.name || '').localeCompare(b.name || '');
                case 'name-desc':
                    return (b.name || '').localeCompare(a.name || '');
                default:
                    return 0;
            }
        });

        // Show no results message if needed
        if (filteredCollection.length === 0) {
            collectionContainer.innerHTML = '<p class="no-results">No flowers match your search.</p>';
            return;
        }

        // Display filtered and sorted collection
        filteredCollection.forEach((flower, index) => {
            const flowerCard = document.createElement('div');
            flowerCard.className = 'flower-card';
            flowerCard.innerHTML = `
                <img src="${flower.imageDataUrl}" alt="${flower.name || 'Unknown flower'}" class="flower-thumbnail">
                <div class="flower-info">
                    <h3>${flower.name || 'Unknown flower'}</h3>
                    <div class="species-name">${flower.details.species || ''}</div>
                    <p>${flower.date}</p>
                    <button class="view-details-button" data-index="${index}">View Details</button>
                    <button class="delete-button" data-index="${index}">Delete</button>
                </div>
            `;
            collectionContainer.appendChild(flowerCard);
        });

        // Add event listeners for view and delete buttons
        document.querySelectorAll('.view-details-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                showFlowerDetails(flowerCollection[index]);
            });
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                flowerCollection.splice(index, 1);
                localStorage.setItem('flowerCollection', JSON.stringify(flowerCollection));
                displayFlowerCollection();
            });
        });
    }

    function showFlowerDetails(flower) {
        const detailsModal = document.createElement('div');
        detailsModal.className = 'modal';
        detailsModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>${flower.name || 'Unknown flower'}</h2>
                <div class="species-name">${flower.details.species || ''}</div>
                <img src="${flower.imageDataUrl}" alt="${flower.name || 'Unknown flower'}" class="flower-image">
                <div class="flower-details">
                    <pre>${JSON.stringify(flower.details, null, 2)}</pre>
                </div>
            </div>
        `;
        document.body.appendChild(detailsModal);

        detailsModal.style.display = 'block';
        detailsModal.querySelector('.close-modal').addEventListener('click', () => {
            detailsModal.style.display = 'none';
            detailsModal.remove();
        });
    }

    // Modal functionality
    settingsButton.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Camera functionality
    takePictureButton.addEventListener('click', async () => {
        if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
            try {
                // Hide the image preview if it's showing
                imagePreview.style.display = 'none';
                
                // Show the camera container
                cameraContainer.style.display = 'flex';
                
                // Get access to the camera
                mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } // Use back camera if available
                });
                
                // Display the camera preview
                cameraPreview.srcObject = mediaStream;
                cameraPreview.style.display = 'block';
                cameraPreview.play();
            } catch (error) {
                console.error('Error accessing camera:', error);
                // If camera fails, fall back to file input with camera capture
                flowerImageInput.setAttribute('capture', 'environment');
                flowerImageInput.click();
            }
        } else {
            // If no camera API, fall back to file input with camera capture
            flowerImageInput.setAttribute('capture', 'environment');
            flowerImageInput.click();
        }
    });

    capturePictureButton.addEventListener('click', () => {
        if (!mediaStream) return;
        
        // Create a canvas to capture the frame
        const canvas = document.createElement('canvas');
        canvas.width = cameraPreview.videoWidth;
        canvas.height = cameraPreview.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Draw the current video frame on the canvas
        ctx.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        
        // Display in the preview
        imagePreview.src = imageDataUrl;
        imagePreview.style.display = 'block';
        removeImageButton.style.display = 'block';
        
        // Stop the camera and hide the camera container
        stopCamera();
    });

    cancelCameraButton.addEventListener('click', () => {
        stopCamera();
    });

    function stopCamera() {
        // Stop the camera stream
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        
        // Hide the camera preview
        cameraPreview.style.display = 'none';
        cameraPreview.srcObject = null;
        
        // Hide the camera container
        cameraContainer.style.display = 'none';
    }

    // Event Listeners
    saveApiKeyButton.addEventListener('click', async () => {
        shapesApiKey = apiKeyInput.value.trim();
        
        // Validate API key format (basic check)
        if (!shapesApiKey) {
            alert('Please enter a valid API Key.');
            return;
        }
        
        // Show saving indicator
        saveApiKeyButton.innerText = 'Saving...';
        saveApiKeyButton.disabled = true;
        
        // Test the API key with a simple ping request if possible
        try {
            // Try to validate the key with a small test request
            // This is a lightweight message that just tests authentication
            const testPayload = {
                model: FLORA_MODEL_ID,
                messages: [
                    {
                        role: "system",
                        content: "Test message"
                    },
                    {
                        role: "user",
                        content: "Hello"
                    }
                ],
                max_tokens: 1  // Request minimal tokens to save quota
            };
            
            const response = await fetch(`${SHAPES_API_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${shapesApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testPayload)
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check and try again.');
                } else {
                    // If there's another error but the key format is valid, we'll still save it
                    console.warn('API responded with an error, but we\'ll save the key anyway:', response.status);
                }
            }
            
            // Save the key to local storage
            localStorage.setItem('shapesApiKey', shapesApiKey);
            alert('API Key verified and saved successfully!');
            settingsModal.style.display = 'none';
            
        } catch (error) {
            console.error('Error validating API key:', error);
            if (error.message.includes('Invalid API key')) {
                alert(error.message);
            } else {
                // If it's a network error or other issue, we'll save the key but warn the user
                localStorage.setItem('shapesApiKey', shapesApiKey);
                alert('API Key saved, but we couldn\'t verify it. You might encounter issues when using the app.');
                settingsModal.style.display = 'none';
            }
        } finally {
            // Reset button state
            saveApiKeyButton.innerText = 'Save Key';
            saveApiKeyButton.disabled = false;
        }
    });

    // File upload functionality
    uploadButton.addEventListener('click', () => {
        // Remove the capture attribute to allow gallery selection
        flowerImageInput.removeAttribute('capture');
        flowerImageInput.click();
    });

    flowerImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                removeImageButton.style.display = 'block';
                // Hide camera container if it's showing
                cameraContainer.style.display = 'none';
                if (mediaStream) {
                    stopCamera();
                }
            };
            reader.readAsDataURL(file);
        }
    });

    identifyFlowerButton.addEventListener('click', async () => {
        if (!shapesApiKey) {
            alert('Please save your Shapes API Key first.');
            settingsModal.style.display = 'block';
            return;
        }
        
        // Check if we have an image from either camera or file upload
        if (!imagePreview.src || imagePreview.src === '#' || imagePreview.src === window.location.href) {
            alert('Please take or upload an image first.');
            return;
        }

        identificationResult.innerHTML = '<p>Identifying, please wait...</p>';

        try {
            const imageDataUrl = imagePreview.src; // Get the data URL from the preview image
            const response = await callShapesApiForIdentification(imageDataUrl);
            const result = displayIdentificationResult(response);
            
            // Add to collection only if identification was successful and it is a flower
            if (result && result.is_flower === true) {
                const flowerData = {
                    imageDataUrl: imageDataUrl,
                    name: result.name || 'Unknown flower',
                    details: result,
                    date: new Date().toLocaleString()
                };
                
                flowerCollection.push(flowerData);
                localStorage.setItem('flowerCollection', JSON.stringify(flowerCollection));
                displayFlowerCollection();
                
                // Switch to collection tab to show the newly added flower
                document.querySelector('.tab-item[data-tab="collectionTab"]').click();
                
                // Get Flora's comment on the identified flower
                try {
                    await getFloraCommentOnFlower(result);
                } catch (commentError) {
                    console.error('Error getting Flora\'s comment:', commentError);
                }
            }
        } catch (error) {
            console.error('Error identifying flower:', error);
            
            let errorMessage = 'Unable to identify flower. Please try again.';
            let errorClass = 'identification-error';
            
            // Add more specific error messages based on the error
            if (error.message.includes('API Key Invalid')) {
                errorMessage = 'Invalid API Key: Please check your API key in settings.';
                // Show settings modal after a short delay
                setTimeout(() => {
                    settingsModal.style.display = 'block';
                }, 1000);
            } else if (error.message.includes('Network Error')) {
                errorMessage = 'Network Error: Please check your internet connection and try again.';
            } else if (error.message.includes('Rate Limit Exceeded')) {
                errorMessage = 'Rate Limit Exceeded: Too many requests. Please wait a minute and try again.';
            }
            
            identificationResult.innerHTML = `
                <div class="${errorClass}">
                    <h3>✗ Identification Failed</h3>
                    <p>${errorMessage}</p>
                </div>
            `;
        }
    });

    sendMessageButton.addEventListener('click', async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        if (!shapesApiKey) {
            alert('Please save your Shapes API Key first.');
            settingsModal.style.display = 'block';
            return;
        }

        appendMessage(message, 'user');
        chatInput.value = '';

        try {
            const response = await callShapesApiForChat(message);
            appendMessage(response.choices[0].message.content, 'flora');
        } catch (error) {
            console.error('Error sending message:', error);
            
            let errorMessage = 'Sorry, I encountered an error processing your message.';
            
            // Add more specific error messages based on the error
            if (error.message.includes('API Key Invalid')) {
                errorMessage = 'Error: Invalid API Key. Please check your API key in settings.';
                // Show settings modal after a short delay
                setTimeout(() => {
                    settingsModal.style.display = 'block';
                }, 1000);
            } else if (error.message.includes('Network Error')) {
                errorMessage = 'Error: Network connection issue. Please check your internet connection.';
            } else if (error.message.includes('Rate Limit Exceeded')) {
                errorMessage = 'Error: Rate limit exceeded. Please wait a minute before sending another message.';
            }
            
            appendMessage(errorMessage, 'flora');
        }
    });

    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessageButton.click();
        }
    });

    function appendMessage(text, sender) {
        const messageElement = document.createElement('p');
        messageElement.textContent = text;
        
        // Check if this is an error message
        const isError = text.toLowerCase().includes('error:');
        
        // Apply appropriate classes
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'flora-message');
        
        if (isError && sender === 'flora') {
            messageElement.classList.add('error-message');
        }
        
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
    }

    // API Call Functions
    async function callShapesApiForIdentification(imageDataUrl) {
        // Convert data URL to a format acceptable for the API
        // If the API accepts base64 directly, we extract the base64 part
        const payload = {
            model: FLORA_MODEL_ID,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyze this image and determine if it contains a flower. If it does, please identify the flower species, common name, and provide brief care instructions. Return your analysis as a valid JSON object with the following format:\n\n1. For successful identification (IS a flower):\n{\"is_flower\": true, \"name\": \"Rose\", \"species\": \"Rosa hybrid\", \"care\": \"Roses need regular pruning and fertilizing for best blooms.\", \"light\": \"Full sun\", \"water\": \"Regular watering, keeping soil moist but not soggy\", \"soil\": \"Well-draining, rich soil with pH 6.0-6.5\"}\n\n2. For images that are NOT flowers:\n{\"is_flower\": false, \"reason\": \"This appears to be a tree/vegetable/household object/etc.\"}\n\n3. For unclear images:\n{\"is_flower\": null, \"reason\": \"The image is too blurry/dark/low quality to make a determination.\"}\n\nBe accurate in your assessment and provide detailed information for confirmed flowers."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageDataUrl // Using the data URL directly
                            }
                        }
                    ]
                }
            ]
        };

        try {
            console.log('Sending identification request with payload:', JSON.stringify(payload, null, 2));
            
            const response = await fetch(`${SHAPES_API_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${shapesApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error Response:', errorData);
                const errorMessage = errorData.error?.message || 'API request failed';
                
                // Handle specific error cases
                if (response.status === 401) {
                    throw new Error('API Key Invalid: Please check your API key and try again.');
                } else if (response.status === 403) {
                    throw new Error('API Access Denied: Your API key doesn\'t have permission to use this model.');
                } else if (response.status === 429) {
                    throw new Error('Rate Limit Exceeded: Please try again later.');
                } else {
                    throw new Error(`API Error (${response.status}): ${errorMessage}`);
                }
            }

            const responseData = await response.json();
            console.log('Identification API Response:', JSON.stringify(responseData, null, 2));
            return responseData;
        } catch (error) {
            console.error('API Call Error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network Error: Please check your internet connection.');
            }
            throw error;
        }
    }

    async function callShapesApiForChat(userMessage) {
        const payload = {
            model: FLORA_MODEL_ID,
            messages: [
                {
                    role: "system",
                    content: "You are Flora, a helpful and friendly plant care assistant. You specialize in flower identification and care advice. Your responses should be informative yet concise. When asked about specific flowers, provide useful care information."
                },
                {
                    role: "user",
                    content: userMessage
                }
            ]
        };

        try {
            console.log('Sending chat request with payload:', JSON.stringify(payload, null, 2));
            
            const response = await fetch(`${SHAPES_API_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${shapesApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error Response:', errorData);
                const errorMessage = errorData.error?.message || 'API request failed';
                
                // Handle specific error cases
                if (response.status === 401) {
                    throw new Error('API Key Invalid: Please check your API key and try again.');
                } else if (response.status === 403) {
                    throw new Error('API Access Denied: Your API key doesn\'t have permission to use this model.');
                } else if (response.status === 429) {
                    throw new Error('Rate Limit Exceeded: Please try again later.');
                } else {
                    throw new Error(`API Error (${response.status}): ${errorMessage}`);
                }
            }

            const responseData = await response.json();
            console.log('Chat API Response:', JSON.stringify(responseData, null, 2));
            return responseData;
        } catch (error) {
            console.error('API Call Error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network Error: Please check your internet connection.');
            }
            throw error;
        }
    }

    function displayIdentificationResult(apiResponse) {
        try {
            // Parse the JSON response from the model
            const messageContent = apiResponse.choices[0].message.content;
            
            // Try to parse it as JSON first
            let flowerData;
            try {
                flowerData = JSON.parse(messageContent);
            } catch (jsonError) {
                // If it's not valid JSON, try to extract JSON from the text content
                const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    flowerData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("Could not extract valid JSON data");
                }
            }
            
            // Handle different result types based on is_flower property
            if (flowerData.is_flower === true) {
                // Successful flower identification
                identificationResult.innerHTML = `
                    <div class="identification-success">
                        <h3>✓ Flower Identified</h3>
                        <p><strong class="flower-title">${flowerData.name || 'Unknown Flower'}</strong></p>
                        <p class="species-name">${flowerData.species || 'Species unknown'}</p>
                        <div class="care-tips">
                            <p><strong>Care Tips:</strong> ${flowerData.care || 'Not available'}</p>
                            <ul>
                                <li><strong>Light:</strong> ${flowerData.light || 'Not specified'}</li>
                                <li><strong>Water:</strong> ${flowerData.water || 'Not specified'}</li>
                                <li><strong>Soil:</strong> ${flowerData.soil || 'Not specified'}</li>
                            </ul>
                        </div>
                    </div>
                `;
                return flowerData;
            } else if (flowerData.is_flower === false) {
                // Not a flower
                identificationResult.innerHTML = `
                    <div class="identification-warning">
                        <h3>⚠ Not a Flower</h3>
                        <p>${flowerData.reason || 'This does not appear to be a flower.'}</p>
                    </div>
                `;
                return null;
            } else {
                // Unclear image
                identificationResult.innerHTML = `
                    <div class="identification-error">
                        <h3>✗ Unable to Identify</h3>
                        <p>${flowerData.reason || 'The image quality is insufficient for identification.'}</p>
                    </div>
                `;
                return null;
            }
        } catch (error) {
            console.error('Error parsing identification result:', error);
            identificationResult.innerHTML = `
                <div class="identification-error">
                    <h3>✗ Identification Failed</h3>
                    <p>Unable to process this image. Please try again with a different image.</p>
                </div>
            `;
            return null;
        }
    }

    async function getFloraCommentOnFlower(flowerDetails) {
        if (!flowerDetails || !flowerDetails.is_flower) {
            return;
        }
        
        const message = `I just identified a ${flowerDetails.name || 'flower'}! Can you tell me something interesting about it?`;
        
        try {
            const response = await callShapesApiForChat(message);
            const comment = response.choices[0].message.content;
            
            // Show the chat and add the messages
            floatingChat.classList.remove('collapsed');
            appendMessage(message, 'user');
            appendMessage(comment, 'flora');
            chatBox.scrollTop = chatBox.scrollHeight;
        } catch (error) {
            console.error('Error getting Flora comment:', error);
        }
    }

    // Add event listener for Remove Image button
    removeImageButton.addEventListener('click', () => {
        // Clear the image preview
        imagePreview.src = '#';
        imagePreview.style.display = 'none';
        removeImageButton.style.display = 'none';
        
        // Reset the file input
        flowerImageInput.value = '';
        
        // Reset the identification result
        identificationResult.innerHTML = '<p>Identification results will appear here...</p>';
    });
    
    // Initialize the collection display
    displayFlowerCollection();

    // Chat toggle functionality
    chatToggleButton.addEventListener('click', () => {
        floatingChat.classList.toggle('collapsed');
        if (!floatingChat.classList.contains('collapsed')) {
            chatInput.focus();
        }
    });

    // Close chat when clicking outside
    document.addEventListener('click', (event) => {
        const isClickInsideChat = floatingChat.contains(event.target);
        if (!isClickInsideChat && !floatingChat.classList.contains('collapsed')) {
            floatingChat.classList.add('collapsed');
        }
    });

    // Prevent chat from closing when clicking inside
    floatingChat.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}); 