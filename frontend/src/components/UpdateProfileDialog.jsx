import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { setUser } from '@/redux/authSlice';
import { Loader2, X, Plus, Tag, Eye, Mail, Phone, Github, Linkedin, FileText, Facebook } from 'lucide-react';
import { USER_API_END_POINT } from '@/utils/constant';
import axios from 'axios';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarImage } from './ui/avatar';

// Popular skills suggestions
const POPULAR_SKILLS = [
  "JavaScript", "React.js", "Node.js", "Python", "Java", "C++", "TypeScript",
  "HTML/CSS", "Angular", "Vue.js", "PHP", "SQL", "MongoDB", "AWS", "Docker",
  "Kubernetes", "Git", "DevOps", "UI/UX", "Figma", "Agile", "Scrum", "REST API",
  "GraphQL", "Mobile Development", "React Native", "Flutter", "iOS", "Android"
];

const TagInput = ({ value = [], onChange, suggestions = [] }) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Handle outside clicks to close suggestions
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && 
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredSuggestions([]);
      return;
    }
    
    const filtered = suggestions
      .filter(skill => 
        skill.toLowerCase().includes(inputValue.toLowerCase()) && 
        !value.includes(skill)
      )
      .slice(0, 5); // Limit to 5 suggestions
    
    setFilteredSuggestions(filtered);
  }, [inputValue, suggestions, value]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e) => {
    // Add tag on Enter or comma
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const addTag = (text) => {
    const tag = text.trim().replace(/,/g, ''); // Remove commas
    
    // Validation: tag must be 2-20 chars, no special chars except dash and space
    if (tag.length < 2 || tag.length > 20) {
      toast.error('Kỹ năng phải từ 2-20 ký tự');
      return;
    }
    
    if (!/^[a-zA-Z0-9\s\-\.+#]+$/.test(tag)) {
      toast.error('Kỹ năng chỉ được chứa chữ cái, số, dấu cách, dấu gạch ngang và dấu chấm');
      return;
    }

    // Don't add if already exists (case insensitive)
    if (value.some(item => item.toLowerCase() === tag.toLowerCase())) {
      toast.error(`Kỹ năng "${tag}" đã tồn tại`);
      return;
    }

    if (value.length >= 15) {
      toast.error('Tối đa 15 kỹ năng');
      return;
    }

    onChange([...value, tag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (indexToRemove) => {
    const newTags = value.filter((_, index) => index !== indexToRemove);
    onChange(newTags);
  };

  const handleSuggestionClick = (suggestion) => {
    addTag(suggestion);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-white mb-2">
        {value.map((tag, index) => (
          <Badge key={index} className="py-1 px-2 flex items-center gap-1 bg-accent/10 text-accent hover:bg-accent/20">
            {tag}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => removeTag(index)}
            />
          </Badge>
        ))}
        
        <div className="grow flex items-center">
          <div className="relative w-full">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => inputValue.trim() && setShowSuggestions(true)}
              className="outline-none bg-transparent w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
              placeholder={value.length === 0 ? "Nhập kỹ năng và nhấn Enter" : ""}
              type="text"
              size="1"
            />
          </div>
        </div>
      </div>
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="cursor-pointer select-none relative py-2 px-3 hover:bg-accent/10 flex items-center gap-2"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <Tag className="h-3.5 w-3.5" />
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UpdateProfileDialog = ({ open, setOpen }) => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    
    const [loading, setLoading] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [skills, setSkills] = useState(user?.profile?.skills || []);
    const [formData, setFormData] = useState({
        bio: user?.profile?.bio || '',
        githubUsername: user?.profile?.githubUsername || '',
        linkedinUsername: user?.profile?.linkedinUsername || '',
        facebookUsername: user?.profile?.facebookUsername || '',
        resumeTitle: '',
        file: null,
        photoFile: null
    });

    // Cập nhật formData khi user thay đổi
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                bio: user?.profile?.bio || '',
                githubUsername: user?.profile?.githubUsername || '',
                linkedinUsername: user?.profile?.linkedinUsername || '',
                facebookUsername: user?.profile?.facebookUsername || ''
            }));
            setSkills(user?.profile?.skills || []);
        }
    }, [user]);

    // Xử lý khởi tạo resumeTitle từ các định dạng khác nhau có thể có của resume
    useEffect(() => {
        if (user?.profile?.resume) {
            // Trường hợp resume là object với thuộc tính title
            if (typeof user?.profile?.resume === 'object' && user?.profile?.resume?.title) {
                setFormData(prev => ({
                    ...prev,
                    resumeTitle: user.profile.resume.title
                }));
            } 
            // Trường hợp có resumeOriginalName (tương thích ngược với dữ liệu cũ)
            else if (user?.profile?.resumeOriginalName) {
                setFormData(prev => ({
                    ...prev,
                    resumeTitle: user.profile.resumeOriginalName
                }));
            }
        }
    }, [user]);

    // Refs for file inputs
    const resumeFileRef = useRef(null);
    const photoFileRef = useRef(null);

    // Lấy URL resume hiện tại (xử lý cả 2 trường hợp: string hoặc object.url)
    const getCurrentResumeUrl = () => {
        if (!user?.profile?.resume) return null;
        
        return typeof user.profile.resume === 'string' 
            ? user.profile.resume 
            : user.profile.resume.url;
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleResumeFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file format
            const validFormats = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validFormats.includes(file.type)) {
                toast.error('Định dạng file không hỗ trợ. Vui lòng tải lên file PDF hoặc DOCX');
                e.target.value = '';
                return;
            }
            
            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                toast.error('File quá lớn. Kích thước tối đa cho phép là 5MB');
                e.target.value = '';
                return;
            }
            
            setFormData({
                ...formData,
                file
            });
            setFileName(file.name);
        }
    };

    const handlePhotoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file format
            const validFormats = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validFormats.includes(file.type)) {
                toast.error('Định dạng ảnh không hỗ trợ. Vui lòng tải lên ảnh JPG hoặc PNG');
                e.target.value = '';
                return;
            }
            
            // Validate file size (max 2MB)
            const maxSize = 2 * 1024 * 1024; // 2MB in bytes
            if (file.size > maxSize) {
                toast.error('Ảnh quá lớn. Kích thước tối đa cho phép là 2MB');
                e.target.value = '';
                return;
            }
            
            setFormData({
                ...formData,
                photoFile: file
            });
            
            // Create preview
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewFile(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Validation for form fields
    const validateForm = () => {
        // Bio validation (max 500 characters)
        if (formData.bio && formData.bio.length > 500) {
            toast.error('Giới thiệu không được vượt quá 500 ký tự');
            return false;
        }
        
        // GitHub username validation
        if (formData.githubUsername && !/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(formData.githubUsername)) {
            toast.error('GitHub username không hợp lệ');
            return false;
        }
        
        // LinkedIn username validation
        if (formData.linkedinUsername && !/^[a-zA-Z0-9-]{3,100}$/.test(formData.linkedinUsername)) {
            toast.error('LinkedIn username không hợp lệ');
            return false;
        }
        
        // Facebook username validation
        if (formData.facebookUsername && !/^[a-zA-Z0-9.]{5,50}$/.test(formData.facebookUsername)) {
            toast.error('Facebook username không hợp lệ');
            return false;
        }
        
        // Resume title validation (max 100 characters)
        if (formData.resumeTitle && formData.resumeTitle.length > 100) {
            toast.error('Tiêu đề CV không được vượt quá 100 ký tự');
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form before submission
        if (!validateForm()) {
            return;
        }
        
        try {
            setLoading(true);
            
            const formPayload = new FormData();
            formPayload.append('bio', formData.bio);
            formPayload.append('githubUsername', formData.githubUsername);
            formPayload.append('linkedinUsername', formData.linkedinUsername);
            formPayload.append('facebookUsername', formData.facebookUsername);
            
            // Luôn gửi resumeTitle nếu có, kể cả khi không có file mới
            if (formData.resumeTitle) {
                formPayload.append('resumeTitle', formData.resumeTitle);
            }
            
            // Gửi file resume nếu có
            if (formData.file) {
                formPayload.append('resume', formData.file);
            }
            
            // Gửi file ảnh đại diện nếu có
            if (formData.photoFile) {
                formPayload.append('profilePhoto', formData.photoFile);
            }

            // Gửi danh sách kỹ năng
            formPayload.append('skills', JSON.stringify(skills));
            
            // Gọi API cập nhật hồ sơ
            const res = await axios.post(`${USER_API_END_POINT}/profile/update`, formPayload, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (res.data.success) {
                // Cập nhật Redux store
                dispatch(setUser(res.data.user));
                
                // Show different message based on whether changes were made
                if (res.data.changes) {
                    toast.success('Hồ sơ đã được cập nhật thành công!');
                } else {
                    toast.info('Không có thông tin nào được thay đổi');
                }
                
                // Reset form state
                setPreviewFile(null);
                setFileName('');
                
                // Close dialog only if changes were made or user explicitly wants to close
                if (res.data.changes) {
                    setTimeout(() => setOpen(false), 500);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Không thể cập nhật hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResume = async () => {
        if (!hasCurrentResume) return;
        
        try {
            setLoading(true);
            const res = await axios.post(`${USER_API_END_POINT}/profile/delete-resume`, {}, {
                withCredentials: true
            });
            
            if (res.data.success) {
                dispatch(setUser(res.data.user));
                toast.success('CV đã được xóa thành công');
                setFileName('');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Không thể xóa CV');
        } finally {
            setLoading(false);
        }
    };

    // Kiểm tra xem có hiện file CV hiện tại không
    const hasCurrentResume = user?.profile?.resume && 
        (typeof user?.profile?.resume === 'string' || user?.profile?.resume?.url);

    // Handler khi dialog đóng
    const handleDialogChange = (open) => {
        // Nếu dialog đóng, reset state
        if (!open) {
            setPreviewFile(null);
            setFileName('');
            if (resumeFileRef.current) resumeFileRef.current.value = '';
            if (photoFileRef.current) photoFileRef.current.value = '';
            
            // Reset formData về giá trị ban đầu từ user
            setFormData({
                bio: user?.profile?.bio || '',
                githubUsername: user?.profile?.githubUsername || '',
                linkedinUsername: user?.profile?.linkedinUsername || '',
                facebookUsername: user?.profile?.facebookUsername || '',
                resumeTitle: typeof user?.profile?.resume === 'object' ? user?.profile?.resume?.title || '' : user?.profile?.resumeOriginalName || '',
                file: null,
                photoFile: null
            });
            setSkills(user?.profile?.skills || []);
        }
        setOpen(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Cập nhật hồ sơ</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin hồ sơ của bạn để nhà tuyển dụng có thể tìm kiếm bạn dễ dàng hơn
                    </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="edit" className="mt-2">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="edit">Chỉnh sửa</TabsTrigger>
                        <TabsTrigger value="preview">Xem trước</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="edit">
                        <form onSubmit={handleSubmit} className="space-y-6" id="profile-form">
                            {/* Profile Photo Section */}
                            <div>
                                <Label className="text-md font-medium mb-2 block">Ảnh đại diện</Label>
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-primary/20"
                                        style={previewFile || user?.profile?.profilePhoto ? {
                                            backgroundImage: `url(${previewFile || user?.profile?.profilePhoto})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        } : {}}
                                    >
                                        {!previewFile && !user?.profile?.profilePhoto && (
                                            <span className="text-4xl text-primary/30">{user?.fullname?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <Button 
                                            type="button"
                                            variant="outline"
                                            onClick={() => photoFileRef.current.click()}
                                            className="mb-2"
                                        >
                                            {previewFile ? 'Thay đổi ảnh' : 'Tải ảnh lên'}
                                        </Button>
                                        <Input 
                                            ref={photoFileRef}
                                            type="file" 
                                            onChange={handlePhotoFileChange} 
                                            accept="image/*"
                                            className="hidden" 
                                        />
                                        {previewFile && (
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => {
                                                    setPreviewFile(null);
                                                    setFormData({...formData, photoFile: null});
                                                    photoFileRef.current.value = '';
                                                }}
                                                className="text-destructive hover:text-destructive/90"
                                            >
                                                <X className="h-4 w-4 mr-1" /> Xóa
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Bio */}
                            <div>
                                <Label htmlFor="bio" className="text-md font-medium mb-2 block">
                                    Giới thiệu
                                    <span className="text-xs text-muted-foreground ml-1">
                                        ({formData.bio?.length || 0}/500)
                                    </span>
                                </Label>
                                <Textarea 
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Viết một vài dòng về bản thân, kinh nghiệm và kỹ năng của bạn"
                                    className="h-24"
                                    maxLength={500}
                                />
                            </div>
                            
                            {/* Social Links */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="githubUsername" className="text-md font-medium mb-2 block">GitHub Username</Label>
                                    <Input
                                        id="githubUsername"
                                        name="githubUsername"
                                        value={formData.githubUsername}
                                        onChange={handleChange}
                                        placeholder="username"
                                        className="bg-white"
                                    />
                                    {formData.githubUsername && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            https://github.com/{formData.githubUsername}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="linkedinUsername" className="text-md font-medium mb-2 block">LinkedIn Username</Label>
                                    <Input
                                        id="linkedinUsername"
                                        name="linkedinUsername"
                                        value={formData.linkedinUsername}
                                        onChange={handleChange}
                                        placeholder="username"
                                        className="bg-white"
                                    />
                                    {formData.linkedinUsername && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            https://linkedin.com/in/{formData.linkedinUsername}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="facebookUsername" className="text-md font-medium mb-2 block">Facebook Username</Label>
                                    <Input
                                        id="facebookUsername"
                                        name="facebookUsername"
                                        value={formData.facebookUsername}
                                        onChange={handleChange}
                                        placeholder="username"
                                        className="bg-white"
                                    />
                                    {formData.facebookUsername && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            https://facebook.com/{formData.facebookUsername}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Skills */}
                            <div>
                                <Label className="text-md font-medium mb-2 block">
                                    Kỹ năng
                                    <span className="text-xs text-muted-foreground ml-1">
                                        ({skills.length}/15)
                                    </span>
                                </Label>
                                <TagInput 
                                    value={skills} 
                                    onChange={setSkills} 
                                    suggestions={POPULAR_SKILLS} 
                                />
                            </div>
                            
                            {/* Resume */}
                            <div>
                                <Label className="text-md font-medium mb-2 block">CV / Resume</Label>
                                <div className="border border-border rounded-md p-4 bg-white">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="font-medium">Tải lên CV của bạn</h4>
                                            <p className="text-sm text-muted-foreground">Định dạng: PDF, DOCX (tối đa 5MB)</p>
                                        </div>
                                        <Button 
                                            type="button"
                                            variant="outline"
                                            onClick={() => resumeFileRef.current.click()}
                                        >
                                            Tải lên
                                        </Button>
                                        <Input 
                                            ref={resumeFileRef}
                                            type="file" 
                                            onChange={handleResumeFileChange} 
                                            accept=".pdf,.doc,.docx"
                                            className="hidden" 
                                        />
                                    </div>
                                    
                                    {/* Resume Title */}
                                    <div>
                                        <Label htmlFor="resumeTitle" className="text-sm font-medium mb-1 block">
                                            Tiêu đề CV
                                            <span className="text-xs text-muted-foreground ml-1">
                                                ({formData.resumeTitle?.length || 0}/100)
                                            </span>
                                        </Label>
                                        <Input
                                            id="resumeTitle"
                                            name="resumeTitle"
                                            value={formData.resumeTitle}
                                            onChange={handleChange}
                                            placeholder="VD: Senior Frontend Developer Resume"
                                            className="bg-white"
                                            maxLength={100}
                                        />
                                    </div>
                                    
                                    {/* Current or New File */}
                                    {(fileName || hasCurrentResume) && (
                                        <div className="mt-3 p-3 bg-secondary/30 rounded-md">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="bg-primary/10 p-2 rounded-md mr-3">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                                            <polyline points="14 2 14 8 20 8"></polyline>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{fileName || formData.resumeTitle || 'Resume'}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {fileName ? 'Sẽ được tải lên' : getCurrentResumeUrl() ? 'File hiện tại' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                {fileName && (
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => {
                                                            setFileName('');
                                                            setFormData({...formData, file: null});
                                                            resumeFileRef.current.value = '';
                                                        }}
                                                        className="text-destructive hover:text-destructive/90"
                                                    >
                                                        <X className="h-4 w-4 mr-1" /> Xóa
                                                    </Button>
                                                )}
                                                {!fileName && hasCurrentResume && (
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={handleDeleteResume}
                                                        className="text-destructive hover:text-destructive/90"
                                                    >
                                                        <X className="h-4 w-4 mr-1" /> Xóa CV
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                            Đang cập nhật...
                                        </>
                                    ) : "Cập nhật hồ sơ"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                    
                    <TabsContent value="preview">
                        <div className="bg-white border border-gray-200 rounded-2xl p-8">
                            <div className='flex justify-between'>
                                <div className='flex items-center gap-4'>
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage 
                                            src={previewFile || user?.profile?.profilePhoto || undefined} 
                                            alt="profile" 
                                        />
                                        {!previewFile && !user?.profile?.profilePhoto && (
                                            <div className="flex h-full w-full items-center justify-center bg-secondary text-4xl">
                                                {user?.fullname?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </Avatar>
                                    <div>
                                        <h1 className='font-medium text-xl'>{user?.fullname}</h1>
                                        <p className="text-gray-500">{formData.bio || "Chưa có thông tin giới thiệu"}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Thông tin liên hệ */}
                            <div className='my-5'>
                                <h2 className="font-bold text-lg mb-3">Thông tin liên hệ</h2>
                                <div className='flex items-center gap-3 my-2'>
                                    <Mail className="h-4 w-4 text-gray-600" />
                                    <span>{user?.email}</span>
                                </div>
                                <div className='flex items-center gap-3 my-2'>
                                    <Phone className="h-4 w-4 text-gray-600" />
                                    <span>{user?.phoneNumber}</span>
                                </div>
                            </div>
                            
                            {/* Mạng xã hội */}
                            <div className='my-5'>
                                <h2 className="font-bold text-lg mb-3">Liên kết mạng xã hội</h2>
                                <div className='space-y-2'>
                                    <div className='flex items-center gap-3'>
                                        <Github className="h-4 w-4 text-gray-600" />
                                        {formData.githubUsername ? (
                                            <a 
                                                href={`https://github.com/${formData.githubUsername}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-accent hover:underline"
                                            >
                                                {formData.githubUsername}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">Chưa cập nhật</span>
                                        )}
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <Linkedin className="h-4 w-4 text-gray-600" />
                                        {formData.linkedinUsername ? (
                                            <a 
                                                href={`https://linkedin.com/in/${formData.linkedinUsername}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-accent hover:underline"
                                            >
                                                {formData.linkedinUsername}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">Chưa cập nhật</span>
                                        )}
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <Facebook className="h-4 w-4 text-gray-600" />
                                        {formData.facebookUsername ? (
                                            <a 
                                                href={`https://facebook.com/${formData.facebookUsername}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-accent hover:underline"
                                            >
                                                {formData.facebookUsername}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">Chưa cập nhật</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Skills */}
                            <div className='my-5'>
                                <h2 className="font-bold text-lg mb-3">Kỹ năng</h2>
                                <div className='flex flex-wrap gap-2'>
                                    {skills && skills.length > 0 
                                        ? skills.map((item, index) => <Badge key={index}>{item}</Badge>) 
                                        : <span className="text-gray-400">Chưa cập nhật</span>
                                    }
                                </div>
                            </div>
                            
                            {/* Resume */}
                            <div className='my-5'>
                                <h2 className="font-bold text-lg mb-3">CV / Resume</h2>
                                <div className='flex items-center gap-3'>
                                    <FileText className="h-4 w-4 text-gray-600" />
                                    {fileName || hasCurrentResume ? (
                                        <a 
                                            href={fileName ? '#' : getCurrentResumeUrl()} 
                                            target={fileName ? '' : '_blank'}
                                            rel={fileName ? '' : "noopener noreferrer"} 
                                            className={`${fileName ? 'text-gray-600' : 'text-accent hover:underline'}`}
                                            onClick={e => fileName && e.preventDefault()}
                                        >
                                            {fileName || formData.resumeTitle || 'Resume'}
                                            {fileName && <span className="text-gray-400 text-xs ml-1">(Chưa tải lên)</span>}
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">Chưa cập nhật</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-4 mt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Hủy
                            </Button>
                            <Button 
                                type="submit" 
                                form="profile-form"
                                disabled={loading}
                                onClick={handleSubmit}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                        Đang cập nhật...
                                    </>
                                ) : "Cập nhật hồ sơ"}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateProfileDialog;