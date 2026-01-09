
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface RatingSystemProps {
    id: string;
    initialRating: number;
    voteCount: number;
    userVote?: number;
    onVote: (rating: number) => Promise<boolean>;
    readOnly?: boolean;
}

export const RatingSystem: React.FC<RatingSystemProps> = ({
    id,
    initialRating,
    voteCount,
    userVote,
    onVote,
    readOnly = false
}) => {
    const [rating, setRating] = useState(initialRating);
    const [count, setCount] = useState(voteCount);
    const [myVote, setMyVote] = useState<number | undefined>(userVote);
    const [hover, setHover] = useState<number | 0>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setRating(initialRating);
        setCount(voteCount);
        setMyVote(userVote);
    }, [initialRating, voteCount, userVote]);

    const handleVote = async (value: number) => {
        if (readOnly || isSubmitting || myVote) return;

        setIsSubmitting(true);
        const success = await onVote(value);
        if (success) {
            // Optimistic update
            const newTotal = (rating * count) + value;
            const newCount = count + 1;
            setRating(newTotal / newCount);
            setCount(newCount);
            setMyVote(value);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        className={`text-xl transition-colors ${
                            (hover || Math.round(rating)) >= star
                            ? 'text-yellow-400'
                            : 'text-gray-600'
                        } ${!readOnly && !myVote ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                        onMouseEnter={() => !readOnly && !myVote && setHover(star)}
                        onMouseLeave={() => !readOnly && !myVote && setHover(0)}
                        onClick={() => handleVote(star)}
                        disabled={readOnly || !!myVote || isSubmitting}
                        title={myVote ? `Te már szavaztál: ${myVote}` : `${star} csillag`}
                    >
                        ★
                    </button>
                ))}
                <span className="ml-2 text-sm text-gray-300 font-bold">
                    {rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">
                    ({count})
                </span>
            </div>
            {myVote && (
                <div className="text-xs text-green-400">
                    Köszönjük a szavazatodat! ({myVote})
                </div>
            )}
        </div>
    );
};
