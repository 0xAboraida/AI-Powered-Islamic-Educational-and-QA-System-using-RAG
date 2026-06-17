using AutoMapper;
using Zad.Application.DTOs;
using Zad.Domain.Entities;

namespace Zad.Application.Mapping;

public class ApplicationMappingProfile : Profile
{
    public ApplicationMappingProfile()
    {
        CreateMap<User, UserDto>();

        CreateMap<ChatSession, ChatSessionDto>()
            .ForMember(dest => dest.MessageCount, opt => opt.MapFrom(src => src.Messages.Count));

        CreateMap<Citation, CitationDto>();

        CreateMap<Message, MessageDto>();

        CreateMap<RequestLog, RequestLogDto>();
    }
}
