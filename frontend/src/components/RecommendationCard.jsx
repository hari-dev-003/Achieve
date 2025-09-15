import React from 'react';

const RecommendationCard = ({ item, type }) => {
    // Define icons and colors based on the recommendation type
    const typeStyles = {
        Course: { icon: '🎓', color: 'cyan' },
        Competition: { icon: '🏆', color: 'yellow' },
        Project: { icon: '🛠️', color: 'indigo' },
        Default: { icon: '💡', color: 'gray' },
    };

    const { icon, color } = typeStyles[type] || typeStyles.Default;

    return (
        <div className="recommendation-card bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 flex flex-col gap-4 hover:border-cyan-500 transition-all duration-300 transform hover:-translate-y-1 opacity-0">
            <div className="flex items-center gap-4">
                <span className={`text-2xl bg-${color}-500/10 p-2 rounded-lg`}>{icon}</span>
                <div>
                    <span className={`text-xs font-bold text-${color}-400`}>{type.toUpperCase()}</span>
                    <h3 className="font-bold text-white leading-tight">{item.title}</h3>
                </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed flex-grow">
                {item.description}
            </p>
            {item.link && (
                <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`self-start text-sm font-semibold text-${color}-400 hover:text-${color}-300 transition-colors`}
                >
                    Learn More &rarr;
                </a>
            )}
        </div>
    );
};

export default RecommendationCard;

