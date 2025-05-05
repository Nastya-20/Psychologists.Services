import React, { useState, useEffect } from "react";
import Loader from "../../components/Loader/Loader";
import LoadMoreButton from "../../components/LoadMoreButton/LoadMoreButton";
import ContactForm from "../../components/ContactForm/ContactForm";
import { ToastContainer, toast } from 'react-toastify';
import { differenceInYears, parseISO } from 'date-fns';
import 'react-toastify/dist/ReactToastify.css';
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { setDoc, collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import css from "./Psychologists.module.css";


export default function Psychologists() {
    const [expandedPsychologistId, setExpandedPsychologistId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(3);
    const [psychologists, setPsychologists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [selectedOption, setSelectedOption] = useState('A to Z');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Перевіряю статус авторизації користувача
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                loadFavorites(currentUser.uid);
            } else {
                try {
                    const savedFavorites = localStorage.getItem("favorites");

                    const parsedFavorites = savedFavorites && savedFavorites !== "undefined"
                        ? JSON.parse(savedFavorites)
                        : [];

                    setFavorites(parsedFavorites);
                } catch (error) {
                    console.error("Error parsing favorites from localStorage:", error);
                    setFavorites([]);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    // Завантажую обраних  психологів
    const loadFavorites = async (userId) => {
        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setFavorites(userSnap.data().favorites || []);
            }
        } catch (error) {
            console.error("Error loading favorites:", error);
        }
    };

    // Додаю/видаляю з обраних
    const toggleFavorite = async (psychologistId) => {
        if (!user) {
            toast.error("This feature is available for authorized users only.");
            return;
        }
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            // Якщо документ користувача не існує, створюю новий
            if (!userSnap.exists()) {
                console.log("User document does not exist. Creating a new document...");
                try {
                    // Створюю документ з полем "favorites", яке містить поточну няню
                    await setDoc(userRef, { favorites: [psychologistId] });
                    setFavorites([psychologistId]);  // Оновлюю стейт локально
                    toast.success("Psychologist added to favorites!");
                } catch (error) {
                    console.error("Error creating user document:", error);
                }
                return;
            }

            // Якщо користувач вже має документ, додаю або видаляю няню з його обраних
            const isFavorite = favorites.includes(psychologistId);
            try {
                await updateDoc(userRef, {
                    favorites: isFavorite ? arrayRemove(psychologistId) : arrayUnion(psychologistId),
                });
                setFavorites((prev) =>
                    isFavorite ? prev.filter((id) => id !== psychologistId) : [...prev, psychologistId]
                );
                toast.success(isFavorite ? "Psychologist removed from favorites!" : "Psychologist added to favorites!");
            } catch (error) {
                console.error("Error updating favorites:", error);
                toast.error("Error updating favorites.");
            }
        } else {
            // Для неавторизованих користувачів
            const updatedFavorites = favorites.includes(psychologistId)
                ? favorites.filter((id) => id !== psychologistId)
                : [...favorites, psychologistId];

            setFavorites(updatedFavorites);
            localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
            console.log("Updated favorites saved to localStorage:", updatedFavorites);
            toast.success("Psychologist added to favorites!");
        }
    };

    // выдкриваю модалку
    const toggleModal = () => setIsModalOpen((prev) => !prev);

    // функція для завантаження білше нянь
    const handleReadMore = (psychologistId) => {
        setExpandedPsychologistId(prevId => (prevId === psychologistId ? null : psychologistId));
    };

    // завантажую психологів
    const fetchPsychologists = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "psychologists"));
            const psychologistsList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPsychologists(psychologistsList);
        } catch (error) {
            console.error("Error fetching psychologists:", error);
            setError("Failed to load psychologists.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPsychologists();
    }, []);

    const options = [
        'A to Z',
        'Z to A',
        'Price: Low to High',
        'Price: High to Low',
        'Popular',
        'Not popular',
        'Show all'
    ];

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleOptionClick = (option) => {
        setSelectedOption(option);
        setIsOpen(false);
    };

    const sortAndFilterPsychologists = () => {
        let sorted = [...psychologists];

        switch (selectedOption) {
            case 'A to Z':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'Z to A':
                sorted.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'Price: Low to High':
                sorted.sort((a, b) => a.price_per_hour - b.price_per_hour);
                break;
            case 'Price: High to Low':
                sorted.sort((a, b) => b.price_per_hour - a.price_per_hour);
                break;
            case 'Popular':
                sorted.sort((a, b) => b.rating - a.rating);
                break;
            case 'Not popular':
                sorted.sort((a, b) => a.rating - b.rating);
                break;
            default:
                break;
        }

        return sorted;
    };

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isModalOpen]);

    return (
        <div className={css.wrapperPsychologists}>
            <p className={css.filtersPsychologists}>Filters</p>
            <div className={css.customSelectWrapper} >
                <div className={css.customSelect} onClick={toggleDropdown}>
                    <span>{selectedOption}</span>
                    <span className={css.arrow}></span>
                </div>
                {isOpen && (
                    <ul className={css.customOptions}>
                        {options.map((option) => (
                            <li
                                key={option}
                                className={css.optionItem}
                                onClick={() => handleOptionClick(option)}
                            >
                                {option}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {loading && <Loader />}
            {error && <p className={css.error}>{error}</p>}

            {!loading && !error && sortAndFilterPsychologists().slice(0, visibleCount).map((psychologist) => {
                const age = psychologist.birthday ? differenceInYears(new Date(), parseISO(psychologist.birthday)) : "N/A";

                return (
                    <div key={psychologist.id} className={css.detailsPsychologists}>
                        <div className={css.imgContainer}>
                            <div className={css.statusWrapper}>
                                <div className={css.greenDot}></div>
                            </div>
                            <img className={css.imgPsychologists} width="96" height="96" src={psychologist.avatar_url} alt={psychologist.name} />
                        </div>
                        <div>
                            <div className={css.detailsItems}>
                                <h3 className={css.detailsTitle}>Psychologist</h3>
                                <ul className={css.detailsLink}>                                                       
                                    <li className={css.detailsText}>
                                        <svg className={css.iconStar} aria-hidden="true" width="16" height="16">
                                            <use href="/icons.svg#icon-star" />
                                        </svg>
                                        Rating:&nbsp;{psychologist.rating}
                                    </li>
                                    <span className={css.line}>|</span>
                                    <li className={css.detailsText}>
                                        Price&nbsp;/&nbsp;1&nbsp;hour:&nbsp;<span className={css.priceNumber}>{psychologist.price_per_hour}$</span>
                                    </li>
                                    <svg
                                        onClick={() => {
                                            toggleFavorite(psychologist.id);
                                        }}
                                        className={favorites.includes(psychologist.id) ? css.iconHeartActive : css.iconHeart}
                                        aria-hidden="true"
                                        width="26"
                                        height="26"
                                    >
                                        <use href="/icons.svg#icon-heart" />
                                    </svg>
                                </ul>
                            </div>
                            <h2 className={css.namePsychologist}>{psychologist.name}</h2>
                            <div className={css.infoPsychologist}>
                                <p className={css.info}>
                                    <span className={css.detail}>Experience:</span> {psychologist.experience}
                                </p>
                                <p className={css.info}>
                                    <span className={css.detail}>License:</span> {psychologist.license}
                                </p>
                                <p className={css.info}>
                                    <span className={css.detail}>Specialization: </span> {psychologist.specialization}
                                </p>
                                <p className={css.info}>
                                    <span className={css.detail}>Initial_consultation: </span> {psychologist.initial_consultation}
                                </p>
                            </div>
                            <p className={css.aboutText}>{psychologist.about || "No information available"}</p>
                            {/* Кнопка Read more */}
                            {expandedPsychologistId !== psychologist.id && (
                                <button className={css.readMore} onClick={() => handleReadMore(psychologist.id)}>
                                    Read more
                                </button>
                            )}
                            {expandedPsychologistId === psychologist.id && (
                                <>
                                    <div className={css.reviewsList}>
                                        {psychologist.reviews?.map((review, index) => (
                                            <div key={index} className={css.reviewItem}>
                                                <div className={css.reviewFirst}>
                                                    <div className={css.reviewerCircle}>
                                                        {review.reviewer ? review.reviewer[0]?.toUpperCase() : "?"}
                                                    </div>
                                                    <div>
                                                        <h3 className={css.reviewName}>{review.reviewer}</h3>
                                                        <svg className={css.iconStar} aria-hidden="true" width="16" height="16">
                                                            <use href="/icons.svg#icon-star" />
                                                        </svg>
                                                        {(review.rating && !isNaN(review.rating)) ? review.rating.toFixed(1) : 5.0}
                                                    </div>
                                                </div>
                                                <p className={css.reviewItemText}>{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            {expandedPsychologistId === psychologist.id && (
                                <>
                                    <button className={css.openModalBtn} onClick={() => setIsModalOpen(true)}>
                                        Make an appointment
                                    </button>
                                    {isModalOpen && <ContactForm onSubmit={toggleModal} toggleModal={toggleModal} isOpen={isModalOpen} psychologist={psychologist} />}
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
            {psychologists.length > visibleCount && (
                <LoadMoreButton onLoadMore={() => setVisibleCount(prev => prev + 3)} />
            )}
            <ToastContainer />
        </div>
    );
};