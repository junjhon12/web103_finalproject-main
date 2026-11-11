interface GameSearchProps{
    onSearch: (searchTerm: string) => void;
}
export default function GameSearch({onSearch}: GameSearchProps){
    return (
        <div>
            <input 
            type="text"
            placeholder="Search games..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full p-3 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500"
            />
        </div>
    )
}