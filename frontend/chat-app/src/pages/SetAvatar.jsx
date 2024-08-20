import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import loader from "../assets/loader.gif";
import { Buffer } from 'buffer';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from 'axios';
import { setAvatarRoute } from '../utils/APIRoutes';

const SetAvatar = () => {
    const api = "https://api.multiavatar.com/45678945";
    const navigate = useNavigate();
    const [avatars, setAvatars] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAvatar, setSelectedAvatar] = useState(undefined);
    const [uploading, setUploading] = useState(false);

    const toastOptions = {
        position: "bottom-right",
        autoClose: 8000,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
    };

    useEffect(() => {
        const checkUser = async () => {
            if (!localStorage.getItem("chat-app-user")) {
                navigate("/login");
            }
        };

        checkUser();
    }, [navigate]);

    const setProfilePic = async () => {
        if (selectedAvatar === undefined) {
            toast.error("Please select an avatar", toastOptions);
            return;
        }
        setUploading(true);
        try {
            const user = JSON.parse(localStorage.getItem("chat-app-user"));
            const { data } = await axios.post(`${setAvatarRoute}/${user._id}`, {
                image: avatars[selectedAvatar],
            });

            if (data.isSet) {
                user.isAvatarImageSet = true;
                user.avatarImage = data.image;
                localStorage.setItem("chat-app-user", JSON.stringify(user));
                navigate("/"); // Navigate inside the app after setting avatar
            } else {
                toast.error("Error setting avatar. Please try again", toastOptions);
            }
        } catch (error) {
            console.error('Error setting profile picture:', error);
            toast.error("Error setting avatar. Please try again", toastOptions);
        } finally {
            setUploading(false);
        }
    };

    const fetchAvatarWithRetry = async (url, retries = 3, backoff = 300) => {
        try {
            const response = await axios.get(url, { responseType: 'text' });
            const buffer = Buffer.from(response.data);
            return buffer.toString('base64');
        } catch (error) {
            if (retries > 0 && error.response && error.response.status === 429) {
                console.log(`Retrying request in ${backoff}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
                return fetchAvatarWithRetry(url, retries - 1, backoff * 2);
            } else {
                throw error;
            }
        }
    };

    useEffect(() => {
        const fetchAvatars = async () => {
            try {
                const avatarUrls = Array.from({ length: 4 }, (_, i) => `${api}/${Math.round(Math.random() * 1000)}`);
                const data = await Promise.all(avatarUrls.map(url => fetchAvatarWithRetry(url)));
                setAvatars(data);
            } catch (error) {
                console.error('Error fetching avatars:', error);
                toast.error("Error fetching avatars. Please try again later.", toastOptions);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAvatars();
    }, []);

    return (
        <>
            {isLoading ? (
                <Container>
                    <img src={loader} alt="loader" className='loader' />
                </Container>
            ) : (
                <Container>
                    <div className="title-container">
                        <h1>Pick an avatar as your profile picture</h1>
                    </div>
                    <div className="avatars">
                        {avatars.map((avatar, index) => (
                            <div
                                key={index}
                                className={`avatar ${selectedAvatar === index ? "selected" : ""}`}
                                onClick={() => setSelectedAvatar(index)}
                            >
                                <img src={`data:image/svg+xml;base64,${avatar}`} alt="avatar" />
                            </div>
                        ))}
                    </div>
                    <button className='submit-btn' onClick={setProfilePic} disabled={uploading}>
                        {uploading ? 'Setting...' : 'Set as profile picture'}
                    </button>
                </Container>
            )}
            <ToastContainer />
        </>
    );
};

export default SetAvatar;

const Container = styled.div`
display: flex;
justify-content: center;
align-items: center;
flex-direction:column;
gap: 3rem;
background-color: #131324;
height: 100vh;
width: 100vw;
.loader{
    max-inline-size:100%;
}
.title-container{
    h1{
        color: white;
    }
}

.avatars{
    display: flex;
    gap: 2rem;
    .avatar{
        border: 0.4rem solid transparent;
        padding: 0.4rem;
        border-radius:5rem;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: 0.5s ease-in-out;

        img{
            height: 6rem;
        }
    }
    .selected{
        border: 0.4rem solid #4e0eff;
    }
}
.submit-btn{
    background-color: #997af0;
    color: white;
    padding: 1rem 2rem;
    text-transform:uppercase;
    border: none;
    font-weight:bold;
    cursor: pointer;
    border-radius: 0.4rem;
    transition: .5s ease-in-out;
    &:hover{
      background-color: #4e0eff;
    }
    &:disabled{
        background-color: #6c5b9a;
        cursor: not-allowed;
    }
}
`;
