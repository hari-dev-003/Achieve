import React, { useState, useEffect } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseconfig';
import { collection, addDoc, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';

// --- Edit Post Modal Component ---
const EditPostModal = ({ post, onSave, onCancel }) => {
    const [message, setMessage] = useState(post.message);
    const [goal, setGoal] = useState(post.goal);

    const handleSave = () => {
        if (!goal.trim() || !message.trim()) {
            toast.error("Fields cannot be empty.");
            return;
        }
        onSave(post.id, { goal, message });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-lg animate-fade-in-up">
                <h2 className="text-xl font-bold text-white mb-4">Edit Your Post</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="goal" className="block text-sm font-medium text-gray-400 mb-2">Goal</label>
                        <input id="goal" type="text" value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                        <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows="4" className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500"></textarea>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition">Cancel</button>
                    <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// --- Delete Confirmation Modal ---
const DeleteConfirmationModal = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md animate-fade-in-up">
            <h2 className="text-xl font-bold text-white mb-4">Confirm Deletion</h2>
            <p className="text-sm text-gray-400 mb-4">Are you sure you want to permanently delete this post? This action cannot be undone.</p>
            <div className="flex justify-end gap-4 mt-6">
                <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition">Cancel</button>
                <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition">Yes, Delete</button>
            </div>
        </div>
    </div>
);


// --- Reusable Post Card Component ---
const PostCard = ({ post, isAuthor, onEdit, onDelete }) => (
    <div className="teammate-post bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4 opacity-0 flex flex-col">
        <div className="flex-grow">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center font-bold text-indigo-400 flex-shrink-0">
                        {post.authorName.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-white">{post.authorName}</p>
                        <p className="text-xs text-gray-400">{post.department} - {post.year}</p>
                    </div>
                </div>
                {isAuthor && (
                     <div className="flex gap-3 text-xs">
                        <button onClick={() => onEdit(post)} className="font-semibold text-yellow-400 hover:text-yellow-300">Edit</button>
                        <button onClick={() => onDelete(post)} className="font-semibold text-red-400 hover:text-red-300">Delete</button>
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className="text-sm text-gray-400">Is looking for teammates for:</p>
                <p className="font-semibold text-cyan-400">{post.goal}</p>
            </div>
            <p className="text-gray-300 italic mt-2">"{post.message}"</p>
        </div>
        <div className="pt-4 border-t border-gray-700/50 mt-4">
            <a href={`mailto:${post.authorEmail}`} className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                Contact {post.authorName.split(' ')[0]} &rarr;
            </a>
        </div>
    </div>
);

// --- Main Find Teammates Page ---
const FindTeammates = () => {
    const { studentDetails } = useOutletContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    
    // State for modals
    const [postToEdit, setPostToEdit] = useState(null);
    const [postToDelete, setPostToDelete] = useState(null);

    useEffect(() => {
        const postMessage = location.state?.peerFinderMessage;
        const postGoal = location.state?.goal;

        if (postMessage && postGoal && studentDetails) {
            const handlePost = async () => {
                setIsPosting(true);
                const toastId = toast.loading("Posting your message...");
                try {
                    await addDoc(collection(db, "teammatePosts"), {
                        authorId: studentDetails.uid,
                        authorName: studentDetails.name,
                        authorEmail: studentDetails.email,
                        department: studentDetails.department,
                        year: studentDetails.year,
                        goal: postGoal,
                        message: postMessage,
                        createdAt: new Date(),
                    });
                    toast.success("Your post is live!", { id: toastId });
                } catch (error) {
                    console.error("Error posting message:", error);
                    toast.error("Could not create post.", { id: toastId });
                } finally {
                    setIsPosting(false);
                    navigate(location.pathname, { replace: true, state: {} });
                }
            };
            handlePost();
        }
    }, [location.state, studentDetails, navigate]);

    useEffect(() => {
        const q = query(collection(db, "teammatePosts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(fetchedPosts);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching posts:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if(posts.length > 0) {
            window.anime({ targets: '.teammate-post', translateY: [20, 0], opacity: [0, 1], delay: window.anime.stagger(100) });
        }
    }, [posts]);

    const handleUpdatePost = async (postId, updatedData) => {
        const toastId = toast.loading("Updating post...");
        try {
            const docRef = doc(db, "teammatePosts", postId);
            await updateDoc(docRef, updatedData);
            toast.success("Post updated!", { id: toastId });
        } catch (error) {
            console.error("Error updating post:", error);
            toast.error("Update failed.", { id: toastId });
        } finally {
            setPostToEdit(null);
        }
    };

    const handleDeletePost = async () => {
        if (!postToDelete) return;
        const toastId = toast.loading("Deleting post...");
        try {
            const docRef = doc(db, "teammatePosts", postToDelete.id);
            await deleteDoc(docRef);
            toast.success("Post deleted.", { id: toastId });
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Could not delete post.", { id: toastId });
        } finally {
            setPostToDelete(null);
        }
    };

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Find Teammates</h1>
            <p className="text-gray-400 text-sm mb-8">Connect with other students for projects, hackathons, and study groups. Posts are generated by the AI Career Pathway tool.</p>
            
            {isPosting && <p className="text-center text-indigo-400">Posting your message to the board...</p>}

            {isLoading ? <Spinner /> : (
                posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map(post => (
                            <PostCard 
                                key={post.id} 
                                post={post}
                                isAuthor={studentDetails?.uid === post.authorId}
                                onEdit={setPostToEdit}
                                onDelete={setPostToDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-800/50 backdrop-blur-sm rounded-lg">
                        <p className="text-gray-400">The teammate finder board is empty.</p>
                        <p className="text-gray-500 text-sm mt-2">Generate a career pathway to create a post!</p>
                    </div>
                )
            )}

            {postToEdit && (
                <EditPostModal 
                    post={postToEdit}
                    onSave={handleUpdatePost}
                    onCancel={() => setPostToEdit(null)}
                />
            )}

            {postToDelete && (
                <DeleteConfirmationModal 
                    onConfirm={handleDeletePost}
                    onCancel={() => setPostToDelete(null)}
                />
            )}
        </div>
    );
};

export default FindTeammates;

