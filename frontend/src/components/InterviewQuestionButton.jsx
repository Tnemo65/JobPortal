import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Loader2, HelpCircle, Briefcase, Sparkles, User, Copy } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '@/utils/constant';
import { toast } from 'sonner';

const InterviewQuestionButton = ({ jobId, jobTitle }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [categories, setCategories] = useState({
    technical: [],
    experience: [],
    culture: []
  });

  const fetchInterviewQuestions = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/ai/interview-questions/${jobId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setQuestions(response.data.questions);
        
        // Parse questions into categories
        parseQuestions(response.data.questions);
      } else {
        toast.error("Không thể tải câu hỏi phỏng vấn");
      }
    } catch (error) {
      console.error('Error fetching interview questions:', error);
      toast.error("Đã xảy ra lỗi khi tải câu hỏi phỏng vấn");
    } finally {
      setLoading(false);
    }
  };

  const parseQuestions = (questionsText) => {
    try {
      // Extract technical questions
      const technicalQuestions = extractQuestionsByCategory(questionsText, 'kỹ thuật', 'chuyên môn');
      
      // Extract experience questions
      const experienceQuestions = extractQuestionsByCategory(questionsText, 'kinh nghiệm');
      
      // Extract culture fit questions
      const cultureQuestions = extractQuestionsByCategory(questionsText, 'tính cách', 'văn hóa', 'phù hợp');
      
      setCategories({
        technical: technicalQuestions,
        experience: experienceQuestions,
        culture: cultureQuestions
      });
    } catch (error) {
      console.error('Error parsing questions:', error);
    }
  };

  const extractQuestionsByCategory = (content, ...keywords) => {
    const questions = [];
    const sections = content.split(/\n\n|\r\n\r\n/);
    
    let currentSection = null;
    
    for (const section of sections) {
      if (keywords.some(keyword => 
        section.toLowerCase().includes(keyword.toLowerCase()) && 
        (section.toLowerCase().includes("câu hỏi") || section.toLowerCase().includes("phần"))
      )) {
        currentSection = section;
        continue;
      }
      
      if (currentSection && section.match(/^\d+[\.\)]/) && keywords.some(keyword => currentSection.toLowerCase().includes(keyword.toLowerCase()))) {
        const questionParts = section.split(/\n/);
        const questionText = questionParts[0].replace(/^\d+[\.\)]/, '').trim();
        
        let purpose = '';
        let suggestions = '';
        
        for (let i = 1; i < questionParts.length; i++) {
          const part = questionParts[i].trim();
          if (part.toLowerCase().startsWith('mục đích:')) {
            purpose = part.replace(/^mục đích:/i, '').trim();
          } else if (part.toLowerCase().startsWith('gợi ý')) {
            suggestions = part.replace(/^gợi ý.*?:/i, '').trim();
            
            for (let j = i + 1; j < questionParts.length; j++) {
              if (questionParts[j] && !questionParts[j].match(/^(mục đích|gợi ý)/i)) {
                suggestions += ' ' + questionParts[j].trim();
              }
            }
          }
        }
        
        questions.push({
          question: questionText,
          purpose,
          suggestions
        });
      }
    }
    
    return questions;
  };
  
  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (newOpen && !questions) {
      fetchInterviewQuestions();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Đã sao chép vào clipboard');
    }).catch(() => {
      toast.error('Không thể sao chép');
    });
  };

  const QuestionGroup = ({ questions, icon }) => (
    <div className="space-y-3 mt-2">
      {questions.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          Không có câu hỏi nào trong mục này
        </p>
      ) : (
        questions.map((q, index) => (
          <Accordion type="single" collapsible key={index}>
            <AccordionItem value={`question-${index}`} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-2.5 hover:no-underline">
                <div className="flex items-start gap-3 text-left">
                  <div className="mt-0.5 bg-accent/10 p-1.5 rounded-full flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="font-medium">{q.question}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                <div className="space-y-2">
                  {q.purpose && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Mục đích câu hỏi:</p>
                      <p className="text-sm text-muted-foreground">{q.purpose}</p>
                    </div>
                  )}
                  {q.suggestions && (
                    <div className="pt-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold">Gợi ý câu trả lời:</p>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-2" 
                          onClick={() => copyToClipboard(q.suggestions)}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" /> Sao chép
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{q.suggestions}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))
      )}
    </div>
  );

  return (
    <>
      <Button
        variant="outline"
        className="rounded-md border-accent text-accent hover:bg-accent/10"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        Câu hỏi phỏng vấn
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-accent" />
              Câu hỏi phỏng vấn cho {jobTitle}
            </DialogTitle>
            <DialogDescription>
              Chuẩn bị trước các câu hỏi phỏng vấn phổ biến cho vị trí này để tăng cơ hội trúng tuyển.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
              <p className="text-muted-foreground">Đang tạo câu hỏi phỏng vấn...</p>
            </div>
          ) : questions ? (
            <div className="mt-2">
              <Tabs defaultValue="technical" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="technical" className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    <span>Chuyên môn</span>
                    <Badge variant="outline" className="ml-1">{categories.technical.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="experience" className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>Kinh nghiệm</span>
                    <Badge variant="outline" className="ml-1">{categories.experience.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="culture" className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span>Văn hóa</span>
                    <Badge variant="outline" className="ml-1">{categories.culture.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="technical">
                  <QuestionGroup questions={categories.technical} icon={<Briefcase className="h-4 w-4 text-accent" />} />
                </TabsContent>
                <TabsContent value="experience">
                  <QuestionGroup questions={categories.experience} icon={<Sparkles className="h-4 w-4 text-accent" />} />
                </TabsContent>
                <TabsContent value="culture">
                  <QuestionGroup questions={categories.culture} icon={<User className="h-4 w-4 text-accent" />} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-8">
              <HelpCircle className="h-16 w-16 text-accent/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Không thể tải câu hỏi phỏng vấn. Vui lòng thử lại.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="outline">Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InterviewQuestionButton;