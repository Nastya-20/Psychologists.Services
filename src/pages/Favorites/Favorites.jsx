import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ContactForm from "../../components/ContactForm/ContactForm";
import { differenceInYears, parseISO } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import LoadMoreButton from "../../components/LoadMoreButton/LoadMoreButton";
import Loader from "../../components/Loader/Loader";
import css from "./Favorites.module.css";

export default function Favorites() {
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
    const [selectedFilters, setSelectedFilters] = useState(() => {
        const savedFilters = localStorage.getItem("selectedFilters");
        return savedFilters ? JSON.parse(savedFilters) : {};
    });

    // Відстежую авторизації користувача
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Завантажую улюблених психологів після оновлення `user`
    useEffect(() => {
        if (user) {
            loadFavorites(user.uid);
        }
    }, [user]);

    useEffect(() => {
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
                setError("Failed to load psychologists.");
                toast.error("Error fetching psychologists.");
            } finally {
                setLoading(false);
            }
        };

        fetchPsychologists();
    }, []);

    // Завантажую обраних психологів
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
            toast.warning("This feature is available for authorized users only.");
            return;
        }

        const userRef = doc(db, "users", user.uid);
        const isFavorite = favorites.includes(psychologistId);

        try {
            await updateDoc(userRef, {
                favorites: isFavorite ? arrayRemove(psychologistId) : arrayUnion(psychologistId),
            });
            setFavorites((prev) =>
                isFavorite ? prev.filter((id) => id !== psychologistId) : [...prev, psychologistId]
            );
            toast.success(
                isFavorite
                    ? "Removed from favorites!"
                    : "Added to favorites!"
            );
        } catch (error) {
            toast.error("Failed to load favorites.");
        }
    };

    const toggleModal = () => setIsModalOpen((prev) => !prev);

    const handleReadMore = (psychologistId) => {
        setExpandedPsychologistId((prevId) => (prevId === psychologistId ? null : psychologistId));
    };

    // Фільтруєю лише нянь, які є в `favorites`
    const favoritePsychologists = psychologist.filter((psychologist) => favorites.includes(psychologist.id));


    // // При завантаженні сторінки зчитую дані з localStorage
    useEffect(() => {
        const savedFilters = localStorage.getItem("selectedFilters");
        if (savedFilters) {
            setSelectedFilters(JSON.parse(savedFilters));
        }
    }, []);

    const options = [
        'A to Z',
        'Z to A',
        'Less than 10$',
        'Greater than 10$',
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
        let sorted = [...favoritePsychologists];

        switch (selectedOption) {
            case 'A to Z':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'Z to A':
                sorted.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'Less than 10$':
                sorted = sorted.filter(nanny => nanny.price_per_hour < 10);
                break;
            case 'Greater than 10$':
                sorted = sorted.filter(nanny => nanny.price_per_hour >= 10);
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
            <div className={css.customSelectWrapper}>
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

            {!loading && !error && favoritePsychologists.length === 0 && (
                <p className={css.noFavorites}>No favorite psychologists yet.</p>
            )}

            {!loading && !error && sortAndFilterPsychologists().slice(0, visibleCount).map((psychologists) => {
                const age = psychologists.birthday ? differenceInYears(new Date(), parseISO(psychologists.birthday)) : "N/A";
                return (
                    <div key={psychologists.id} className={css.detailsPsychologists}>
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
                                        <svg className={css.iconMap} aria-hidden="true" width="32" height="32">
                                            <use href="/icons.svg#icon-map" />
                                        </svg>{psychologist.location}
                                    </li>
                                    <span className={css.line}>|</span>
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
                                    <span className={css.detail}>Age: </span>
                                    <span className={css.underlined}>{age}</span>
                                </p>
                                <p className={css.info}>
                                    <span className={css.detail}>Experience:</span> {psychologist.experience}
                                </p>
                                <p className={css.info}>
                                    <span className={css.detail}>Kids age:</span> {psychologist.kids_age}
                                </p>
                                <p className={css.info}>
                                    <span className={css.detail}>Characters: </span> {psychologist.characters?.join(',')}
                                </p>
                                <p className={css.info}>
                                    <span className={css.detail}>Education: </span> {psychologist.education}
                                </p>
                            </div>
                            <p className={css.aboutText}>{psychologist.about || "No information available"}</p>

                            {/* Кнопка Read more */}
                            {expandedPsychologistsId !== psychologist.id && (
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

                            {/* Кнопка Make an appointment */}

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
            {favoritePsychologists.length > visibleCount && (
                <LoadMoreButton onLoadMore={() => setVisibleCount(prev => prev + 3)} />
            )}
            <ToastContainer />
        </div>
    );
}