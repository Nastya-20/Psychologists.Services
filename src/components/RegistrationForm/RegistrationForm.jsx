import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { registerSchema } from '../AuthModal/authSchema';
import css from './RegistrationForm.module.css';

const RegistrationForm = ({ onSubmit, onClose, onSwitchToLogin }) => {
    const [showPassword, setShowPassword] = useState(false);
    const { reset, register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(registerSchema),
    });

    const submitForm = async (data) => {
        try {
            await onSubmit(data);
            onClose();
            reset();
        } catch (error) {
            onSwitchToLogin();
        }
    };

    return (
        <form onSubmit={handleSubmit(submitForm)} className={css.authForm}>
            <div>
                {errors.name && <p className={css.errors}>{errors.name.message}</p>}
                <input
                    className={css.nameForm}
                    type="text"
                    placeholder="Name"
                    {...register('name')}
                />
            </div>
            <div>
                {errors.email && <p className={css.errors}>{errors.email.message}</p>}
                <input
                    className={css.emailForm}
                    type="email"
                    placeholder="Email"
                    {...register('email')}
                />
            </div>
            <div>
                {errors.password && <p className={css.errors}>{errors.password.message}</p>}
                <div className={css.inputInner}>
                    <input
                        className={css.passwordForm}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        autoComplete="current-password"
                        {...register('password')}
                    />
                    <svg
                        className={css.iconEye}
                        aria-hidden="true"
                        width="16"
                        height="16"
                        onClick={() => setShowPassword((prev) => !prev)}
                    >
                        <use href={`/icons.svg#icon-eye${showPassword ? "" : "-off"}`} />
                    </svg>
                </div>
            </div>
            <button className={css.buttonForm} type="submit">Sign Up</button>
        </form>
    );
};

export default RegistrationForm;