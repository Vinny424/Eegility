using AutoMapper;
using EegilityApi.Models;

namespace EegilityApi.Configuration;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        // User mappings
        CreateMap<User, UserResponseDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role))
            .ForMember(dest => dest.Institution, opt => opt.MapFrom(src => src.Institution))
            .ForMember(dest => dest.Department, opt => opt.MapFrom(src => src.Department))
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.Phone))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
            .ForMember(dest => dest.LastLoginAt, opt => opt.MapFrom(src => src.LastLoginAt))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive));

        CreateMap<UserRegistrationDto, User>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email.ToLowerInvariant()))
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            .ForMember(dest => dest.Institution, opt => opt.MapFrom(src => src.Institution))
            .ForMember(dest => dest.Department, opt => opt.MapFrom(src => src.Department))
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.Phone))
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => "User"))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.LastLoginAt, opt => opt.Ignore())
            .ForMember(dest => dest.Permissions, opt => opt.MapFrom(src => new List<string> { "read", "upload" }))
            .ForMember(dest => dest.EegDataRecords, opt => opt.Ignore());

        // EEG Data mappings
        CreateMap<EegData, EegDataResponseDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Filename, opt => opt.MapFrom(src => src.Filename))
            .ForMember(dest => dest.OriginalFilename, opt => opt.MapFrom(src => src.OriginalFilename))
            .ForMember(dest => dest.Format, opt => opt.MapFrom(src => src.Format.ToString()))
            .ForMember(dest => dest.Size, opt => opt.MapFrom(src => src.Size))
            .ForMember(dest => dest.UploadDate, opt => opt.MapFrom(src => src.UploadDate))
            .ForMember(dest => dest.Metadata, opt => opt.MapFrom(src => src.Metadata))
            .ForMember(dest => dest.BidsCompliant, opt => opt.MapFrom(src => src.BidsCompliant))
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => src.Tags))
            .ForMember(dest => dest.Notes, opt => opt.MapFrom(src => src.Notes))
            .ForMember(dest => dest.AdhdAnalysis, opt => opt.MapFrom(src => src.AdhdAnalysis))
            .ForMember(dest => dest.DataUrl, opt => opt.MapFrom(src => src.DataUrl));

        CreateMap<EegUploadDto, EegData>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.Filename, opt => opt.Ignore())
            .ForMember(dest => dest.OriginalFilename, opt => opt.MapFrom(src => src.File.FileName))
            .ForMember(dest => dest.Format, opt => opt.Ignore())
            .ForMember(dest => dest.Size, opt => opt.MapFrom(src => src.File.Length))
            .ForMember(dest => dest.UploadDate, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.Notes, opt => opt.MapFrom(src => src.Notes))
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => src.Tags))
            .ForMember(dest => dest.BidsCompliant, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.AdhdAnalysis, opt => opt.Ignore())
            .ForMember(dest => dest.DataUrl, opt => opt.Ignore())
            .ForMember(dest => dest.GridFsId, opt => opt.Ignore())
            .ForMember(dest => dest.BidsData, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.Metadata, opt => opt.MapFrom(src => new EegMetadata
            {
                Subject = new SubjectMetadata
                {
                    Id = src.SubjectId,
                    Age = src.SubjectAge,
                    Gender = src.SubjectGender,
                    Group = src.SubjectGroup
                },
                Session = src.Session,
                Task = src.Task,
                Acquisition = src.Acquisition
            }));

        // Metadata mappings
        CreateMap<EegMetadata, EegMetadata>()
            .ForMember(dest => dest.Subject, opt => opt.MapFrom(src => src.Subject))
            .ForMember(dest => dest.Session, opt => opt.MapFrom(src => src.Session))
            .ForMember(dest => dest.Task, opt => opt.MapFrom(src => src.Task))
            .ForMember(dest => dest.Acquisition, opt => opt.MapFrom(src => src.Acquisition))
            .ForMember(dest => dest.Channels, opt => opt.MapFrom(src => src.Channels))
            .ForMember(dest => dest.SampleRate, opt => opt.MapFrom(src => src.SampleRate))
            .ForMember(dest => dest.Duration, opt => opt.MapFrom(src => src.Duration))
            .ForMember(dest => dest.CustomFields, opt => opt.MapFrom(src => src.CustomFields));

        CreateMap<SubjectMetadata, SubjectMetadata>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Age, opt => opt.MapFrom(src => src.Age))
            .ForMember(dest => dest.Gender, opt => opt.MapFrom(src => src.Gender))
            .ForMember(dest => dest.Group, opt => opt.MapFrom(src => src.Group))
            .ForMember(dest => dest.Handedness, opt => opt.MapFrom(src => src.Handedness))
            .ForMember(dest => dest.Medications, opt => opt.MapFrom(src => src.Medications))
            .ForMember(dest => dest.Diagnosis, opt => opt.MapFrom(src => src.Diagnosis));

        // ADHD Analysis mappings
        CreateMap<AdhdAnalysis, AdhdAnalysis>()
            .ForMember(dest => dest.Requested, opt => opt.MapFrom(src => src.Requested))
            .ForMember(dest => dest.Performed, opt => opt.MapFrom(src => src.Performed))
            .ForMember(dest => dest.InProgress, opt => opt.MapFrom(src => src.InProgress))
            .ForMember(dest => dest.Result, opt => opt.MapFrom(src => src.Result))
            .ForMember(dest => dest.Confidence, opt => opt.MapFrom(src => src.Confidence))
            .ForMember(dest => dest.PerformedAt, opt => opt.MapFrom(src => src.PerformedAt))
            .ForMember(dest => dest.Error, opt => opt.MapFrom(src => src.Error))
            .ForMember(dest => dest.Details, opt => opt.MapFrom(src => src.Details));
    }
}