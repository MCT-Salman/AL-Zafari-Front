
const StatCircle = ({ value, label, icon: Icon, icon_color, subtitle_color, num_color }) => {
    return (
        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-primary-s border-2 border-[#E5E5E5] hover:border-primary-f hover:shadow-md transition-all duration-300 group">
            <div
                className={`w-16 h-16 flex items-center justify-center rounded-full bg-white border-2 shadow-sm group-hover:scale-110 transition-transform duration-300 ${icon_color}`}
            >
                <Icon className={`w-7 h-7 ${icon_color}`} />
            </div>
            <div className="text-center">
                <span className={`block text-2xl font-black ${num_color}`}>{value}</span>
                <span className={`text-xs font-bold ${subtitle_color}`}>{label}</span>
            </div>
        </div>
    )
}

export default StatCircle